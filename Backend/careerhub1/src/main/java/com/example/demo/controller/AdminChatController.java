package com.example.demo.controller;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.entity.ChatFile;
import com.example.demo.entity.ChatMessage;
import com.example.demo.entity.Company;
import com.example.demo.entity.Notification;
import com.example.demo.entity.User;
import com.example.demo.repository.ChatFileRepository;
import com.example.demo.repository.ChatMessageRepository;
import com.example.demo.repository.CompanyRepository;
import com.example.demo.repository.NotificationRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.EmailNotifier;

@RestController
@RequestMapping("/api/admin/chats")
public class AdminChatController {

    public record ReplyRequest(String text) {}

    public record ConversationRow(Long userId, String userName, String userGmail,
                                  Long companyId, String companyName,
                                  String lastText, String lastFrom, LocalDateTime lastAt, long unread) {}

    public record ThreadDto(Long userId, String userName, String userGmail,
                            Long companyId, String companyName,
                            List<ChatController.MessageDto> messages) {}

    private static final int MAX_TEXT = 2000;

    private final ChatMessageRepository chats;
    private final ChatFileRepository files;
    private final UserRepository users;
    private final CompanyRepository companies;
    private final NotificationRepository notifications;
    private final EmailNotifier emailNotifier;

    public AdminChatController(ChatMessageRepository chats,
                               ChatFileRepository files,
                               UserRepository users,
                               CompanyRepository companies,
                               NotificationRepository notifications,
                               EmailNotifier emailNotifier) {
        this.chats = chats;
        this.files = files;
        this.users = users;
        this.companies = companies;
        this.notifications = notifications;
        this.emailNotifier = emailNotifier;
    }

    private static ResponseEntity<?> msg(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of("message", message));
    }

    @GetMapping
    public List<ConversationRow> list() {
        Map<String, List<ChatMessage>> grouped = new LinkedHashMap<>();
        for (ChatMessage m : chats.findAllByOrderByIdAsc()) {
            String key = m.getUser().getId() + "-" + m.getCompany().getId();
            grouped.computeIfAbsent(key, k -> new ArrayList<>()).add(m);
        }

        List<ConversationRow> rows = new ArrayList<>();
        for (List<ChatMessage> list : grouped.values()) {
            ChatMessage last = list.get(list.size() - 1);
            User u = last.getUser();
            Company c = last.getCompany();
            long unread = list.stream().filter(m -> "ME".equals(m.getSender()) && !m.isAdminRead()).count();
            String lastText = last.isHasFile() ? "\uD83D\uDCCE " + last.getFileName() : last.getText();
            rows.add(new ConversationRow(u.getId(), u.getFullName(), u.getGmail(),
                    c.getId(), c.getName(), lastText,
                    "ME".equals(last.getSender()) ? "candidate" : "company", last.getCreatedAt(), unread));
        }
        rows.sort(Comparator.comparing(ConversationRow::lastAt).reversed());
        return rows;
    }

    @GetMapping("/{userId}/{companyId}")
    public ResponseEntity<?> thread(@PathVariable Long userId, @PathVariable Long companyId) {
        User u = users.findById(userId).orElse(null);
        Company c = companies.findById(companyId).orElse(null);
        if (u == null || c == null) return msg(HttpStatus.NOT_FOUND, "Conversation not found.");

        List<ChatMessage> list = chats.findByUserIdAndCompanyIdOrderByIdAsc(userId, companyId);

        List<ChatMessage> unread = list.stream()
                .filter(m -> "ME".equals(m.getSender()) && !m.isAdminRead()).toList();
        if (!unread.isEmpty()) {
            unread.forEach(m -> m.setAdminRead(true));
            chats.saveAll(unread);
        }

        return ResponseEntity.ok(new ThreadDto(u.getId(), u.getFullName(), u.getGmail(), c.getId(), c.getName(),
                list.stream().map(ChatController.MessageDto::from).toList()));
    }

    @PostMapping("/{userId}/{companyId}/messages")
    public ResponseEntity<?> reply(@PathVariable Long userId, @PathVariable Long companyId,
                                   @RequestBody ReplyRequest r) {
        User u = users.findById(userId).orElse(null);
        Company c = companies.findById(companyId).orElse(null);
        if (u == null || c == null) return msg(HttpStatus.NOT_FOUND, "Conversation not found.");
        if (r.text() == null || r.text().isBlank()) return msg(HttpStatus.BAD_REQUEST, "Please write a message.");
        String text = r.text().trim();
        if (text.length() > MAX_TEXT)
            return msg(HttpStatus.BAD_REQUEST, "Message is too long (maximum " + MAX_TEXT + " characters).");

        ChatMessage m = new ChatMessage();
        m.setUser(u);
        m.setCompany(c);
        m.setSender("THEM");
        m.setType("text");
        m.setText(text);
        ChatMessage saved = chats.save(m);

        String preview = text.length() > 120 ? text.substring(0, 120) + "..." : text;
        String title = "New message from " + c.getName();
        String link = "/messages?company=" + c.getId();
        Notification n = new Notification();
        n.setUser(u);
        n.setTitle(title);
        n.setMessage(preview);
        n.setLink(link);
        notifications.save(n);
        if (u.isMessageAlerts()) {
            emailNotifier.emailUser(u.getGmail(), u.getFullName(), title, preview, link);
        }

        return ResponseEntity.ok(ChatController.MessageDto.from(saved));
    }

    @GetMapping("/messages/{messageId}/file")
    public ResponseEntity<?> file(@PathVariable Long messageId) {
        ChatMessage m = chats.findById(messageId).orElse(null);
        if (m == null || !m.isHasFile()) return msg(HttpStatus.NOT_FOUND, "File not found.");
        ChatFile f = files.findByMessageId(messageId).orElse(null);
        if (f == null) return msg(HttpStatus.NOT_FOUND, "File not found.");
        return ResponseEntity.ok(Map.of("name", m.getFileName(), "data", f.getData()));
    }
}
