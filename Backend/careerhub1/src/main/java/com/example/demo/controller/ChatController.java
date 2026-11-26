package com.example.demo.controller;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.entity.ChatFile;
import com.example.demo.entity.ChatMessage;
import com.example.demo.entity.Company;
import com.example.demo.entity.JobApplication;
import com.example.demo.entity.User;
import com.example.demo.repository.ChatFileRepository;
import com.example.demo.repository.ChatMessageRepository;
import com.example.demo.repository.CompanyFollowRepository;
import com.example.demo.repository.CompanyRepository;
import com.example.demo.repository.JobApplicationRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.AdminNotifier;

@RestController
@RequestMapping("/api/chats")
public class ChatController {

    public record TextRequest(String text) {}
    public record FileRequest(String name, Long size, String data) {}

    public record MessageDto(Long id, String from, String type, String text,
                             String name, Long size, boolean hasFile, LocalDateTime createdAt) {
        static MessageDto from(ChatMessage m) {
            return new MessageDto(m.getId(), "ME".equals(m.getSender()) ? "me" : "them", m.getType(),
                    m.getText(), m.getFileName(), m.getFileSize(), m.isHasFile(), m.getCreatedAt());
        }
    }

    public record ConversationDto(Long id, String name, String role,
                                  boolean resumeAsked, boolean resumeSent, List<MessageDto> messages) {}

    private static final int MAX_TEXT = 2000;
    private static final int MAX_FILE = 1_600_000;
    private static final String REQUEST_TEXT = "Thanks for your message! Please send us your resume.";
    private static final String THANKS_TEXT = "Thank you! We have received your resume. Our team will review it soon.";

    private final UserRepository users;
    private final CompanyRepository companies;
    private final CompanyFollowRepository follows;
    private final JobApplicationRepository applications;
    private final ChatMessageRepository chats;
    private final ChatFileRepository files;
    private final AdminNotifier adminNotifier;

    public ChatController(UserRepository users,
                          CompanyRepository companies,
                          CompanyFollowRepository follows,
                          JobApplicationRepository applications,
                          ChatMessageRepository chats,
                          ChatFileRepository files,
                          AdminNotifier adminNotifier) {
        this.users = users;
        this.companies = companies;
        this.follows = follows;
        this.applications = applications;
        this.chats = chats;
        this.files = files;
        this.adminNotifier = adminNotifier;
    }

    private Optional<User> me(Authentication auth) {
        if (auth == null || auth.getName() == null) return Optional.empty();
        return users.findByGmailIgnoreCase(auth.getName());
    }

    private static boolean blank(String s) {
        return s == null || s.isBlank();
    }

    private static ResponseEntity<?> msg(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of("message", message));
    }

    private static String roleOf(Company c) {
        return "Recruiter \u2022 " + c.getCity();
    }

    private ChatMessage save(User u, Company c, String sender, String type, String text) {
        ChatMessage m = new ChatMessage();
        m.setUser(u);
        m.setCompany(c);
        m.setSender(sender);
        m.setType(type);
        m.setText(text);
        if ("ME".equals(sender)) m.setAdminRead(false);
        return chats.save(m);
    }

    private static boolean hasUnreadForAdmin(List<ChatMessage> history) {
        return history.stream().anyMatch(m -> "ME".equals(m.getSender()) && !m.isAdminRead());
    }

    private void tellRecruiters(User u, Company c, boolean alreadyUnread, String what) {
        if (alreadyUnread) return;
        adminNotifier.notifyAdmins("New message from " + u.getFullName(),
                u.getFullName() + " wrote to " + c.getName() + ": " + what, "/admin/messages");
    }

    private static boolean resumeAsked(List<ChatMessage> history) {
        return history.stream().anyMatch(m -> "resume-request".equals(m.getType()));
    }

    private static boolean resumeSent(List<ChatMessage> history) {
        Long requestId = history.stream().filter(m -> "resume-request".equals(m.getType()))
                .map(ChatMessage::getId).findFirst().orElse(null);
        if (requestId == null) return false;
        return history.stream().anyMatch(m -> "ME".equals(m.getSender()) && m.isHasFile() && m.getId() > requestId);
    }

    private ConversationDto toDto(Company c, List<ChatMessage> history) {
        return new ConversationDto(c.getId(), c.getName(), roleOf(c),
                resumeAsked(history), resumeSent(history),
                history.stream().map(MessageDto::from).toList());
    }

    @GetMapping
    public ResponseEntity<?> list(@RequestParam(required = false) Long include, Authentication auth) {
        User u = me(auth).orElse(null);
        if (u == null) return msg(HttpStatus.UNAUTHORIZED, "Please login again.");

        List<ChatMessage> all = chats.findByUserIdOrderByIdAsc(u.getId());
        Map<Long, List<ChatMessage>> byCompany = new LinkedHashMap<>();
        for (ChatMessage m : all) {
            byCompany.computeIfAbsent(m.getCompany().getId(), k -> new ArrayList<>()).add(m);
        }

        Set<Long> others = new LinkedHashSet<>();
        for (JobApplication a : applications.findByUserIdOrderByAppliedAtDesc(u.getId())) {
            others.add(a.getJob().getCompany().getId());
        }
        follows.findByUserId(u.getId()).forEach(f -> others.add(f.getCompany().getId()));
        if (include != null) others.add(include);
        others.removeAll(byCompany.keySet());

        List<ConversationDto> out = new ArrayList<>();

        byCompany.entrySet().stream()
                .sorted(Comparator.comparing((Map.Entry<Long, List<ChatMessage>> e) ->
                        e.getValue().get(e.getValue().size() - 1).getId()).reversed())
                .forEach(e -> out.add(toDto(e.getValue().get(0).getCompany(), e.getValue())));

        companies.findAllById(others).stream()
                .sorted(Comparator.comparing(Company::getName, String.CASE_INSENSITIVE_ORDER))
                .forEach(c -> out.add(toDto(c, List.of())));

        return ResponseEntity.ok(out);
    }

    @PostMapping("/{companyId}/messages")
    @Transactional
    public ResponseEntity<?> sendText(@PathVariable Long companyId, @RequestBody TextRequest r, Authentication auth) {
        User u = me(auth).orElse(null);
        if (u == null) return msg(HttpStatus.UNAUTHORIZED, "Please login again.");
        Company c = companies.findById(companyId).orElse(null);
        if (c == null) return msg(HttpStatus.NOT_FOUND, "Company not found.");
        if (blank(r.text())) return msg(HttpStatus.BAD_REQUEST, "Please write a message.");
        if (r.text().trim().length() > MAX_TEXT)
            return msg(HttpStatus.BAD_REQUEST, "Message is too long (maximum " + MAX_TEXT + " characters).");

        List<ChatMessage> history = chats.findByUserIdAndCompanyIdOrderByIdAsc(u.getId(), companyId);
        boolean asked = resumeAsked(history);

        boolean alreadyUnread = hasUnreadForAdmin(history);
        ChatMessage mine = save(u, c, "ME", "text", r.text().trim());
        String preview = r.text().trim();
        tellRecruiters(u, c, alreadyUnread, preview.length() > 80 ? preview.substring(0, 80) + "..." : preview);
        ChatMessage reply = asked ? null : save(u, c, "THEM", "resume-request", REQUEST_TEXT);
        return ResponseEntity.ok(answer(mine, reply));
    }

    @PostMapping("/{companyId}/files")
    @Transactional
    public ResponseEntity<?> sendFile(@PathVariable Long companyId, @RequestBody FileRequest r, Authentication auth) {
        User u = me(auth).orElse(null);
        if (u == null) return msg(HttpStatus.UNAUTHORIZED, "Please login again.");
        Company c = companies.findById(companyId).orElse(null);
        if (c == null) return msg(HttpStatus.NOT_FOUND, "Company not found.");

        if (blank(r.name()) || r.name().length() > 200
                || !r.name().toLowerCase().matches(".*\\.(pdf|doc|docx|png|jpg|jpeg|txt)$")) {
            return msg(HttpStatus.BAD_REQUEST, "Please send a PDF, Word, image or text file.");
        }
        if (blank(r.data()) || !r.data().startsWith("data:")) {
            return msg(HttpStatus.BAD_REQUEST, "The file is missing.");
        }
        if (r.data().length() > MAX_FILE) {
            return msg(HttpStatus.BAD_REQUEST, "Please choose a file under 1 MB.");
        }

        List<ChatMessage> history = chats.findByUserIdAndCompanyIdOrderByIdAsc(u.getId(), companyId);
        boolean thankYou = resumeAsked(history) && !resumeSent(history);

        boolean alreadyUnread = hasUnreadForAdmin(history);
        ChatMessage mine = save(u, c, "ME", "file", null);
        tellRecruiters(u, c, alreadyUnread, "sent the file " + r.name().trim());
        mine.setFileName(r.name().trim());
        mine.setFileSize(r.size());
        mine.setHasFile(true);
        chats.save(mine);

        ChatFile f = new ChatFile();
        f.setMessage(mine);
        f.setData(r.data());
        files.save(f);

        ChatMessage reply = thankYou ? save(u, c, "THEM", "text", THANKS_TEXT) : null;
        return ResponseEntity.ok(answer(mine, reply));
    }

    @GetMapping("/messages/{messageId}/file")
    public ResponseEntity<?> download(@PathVariable Long messageId, Authentication auth) {
        User u = me(auth).orElse(null);
        if (u == null) return msg(HttpStatus.UNAUTHORIZED, "Please login again.");
        ChatMessage m = chats.findById(messageId).orElse(null);
        if (m == null || !m.getUser().getId().equals(u.getId()) || !m.isHasFile()) {
            return msg(HttpStatus.NOT_FOUND, "File not found.");
        }
        ChatFile f = files.findByMessageId(messageId).orElse(null);
        if (f == null) return msg(HttpStatus.NOT_FOUND, "File not found.");
        return ResponseEntity.ok(Map.of("name", m.getFileName(), "data", f.getData()));
    }

    private static Map<String, Object> answer(ChatMessage mine, ChatMessage reply) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("message", MessageDto.from(mine));
        out.put("reply", reply == null ? null : MessageDto.from(reply));
        return out;
    }
}
