package com.example.demo.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.entity.ChatMessage;
import com.example.demo.entity.JobApplication;
import com.example.demo.entity.User;
import com.example.demo.repository.ApplicationResumeRepository;
import com.example.demo.repository.ChatFileRepository;
import com.example.demo.repository.ChatMessageRepository;
import com.example.demo.repository.CompanyFollowRepository;
import com.example.demo.repository.InterviewRepository;
import com.example.demo.repository.JobApplicationRepository;
import com.example.demo.repository.NotificationRepository;
import com.example.demo.repository.PasswordResetTokenRepository;
import com.example.demo.repository.SavedJobRepository;
import com.example.demo.repository.UserProfileRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.UserResumeRepository;

@Service
public class AccountService {

    private final UserRepository users;
    private final JobApplicationRepository applications;
    private final ApplicationResumeRepository applicationResumes;
    private final SavedJobRepository savedJobs;
    private final UserProfileRepository profiles;
    private final UserResumeRepository resumes;
    private final NotificationRepository notifications;
    private final InterviewRepository interviews;
    private final ChatMessageRepository chats;
    private final ChatFileRepository chatFiles;
    private final CompanyFollowRepository follows;
    private final PasswordResetTokenRepository resetTokens;

    public AccountService(UserRepository users,
                          JobApplicationRepository applications,
                          ApplicationResumeRepository applicationResumes,
                          SavedJobRepository savedJobs,
                          UserProfileRepository profiles,
                          UserResumeRepository resumes,
                          NotificationRepository notifications,
                          InterviewRepository interviews,
                          ChatMessageRepository chats,
                          ChatFileRepository chatFiles,
                          CompanyFollowRepository follows,
                          PasswordResetTokenRepository resetTokens) {
        this.users = users;
        this.applications = applications;
        this.applicationResumes = applicationResumes;
        this.savedJobs = savedJobs;
        this.profiles = profiles;
        this.resumes = resumes;
        this.notifications = notifications;
        this.interviews = interviews;
        this.chats = chats;
        this.chatFiles = chatFiles;
        this.follows = follows;
        this.resetTokens = resetTokens;
    }

    @Transactional
    public void deleteUser(User user) {
        Long id = user.getId();

        List<JobApplication> apps = applications.findByUserIdOrderByAppliedAtDesc(id);
        for (JobApplication a : apps) {
            applicationResumes.findByApplicationId(a.getId()).ifPresent(applicationResumes::delete);
        }
        applications.deleteAll(apps);

        savedJobs.deleteAll(savedJobs.findByUserIdOrderByIdDesc(id));
        follows.deleteAll(follows.findByUserId(id));

        List<ChatMessage> messages = chats.findByUserIdOrderByIdAsc(id);
        for (ChatMessage m : messages) {
            if (m.isHasFile()) {
                chatFiles.findByMessageId(m.getId()).ifPresent(chatFiles::delete);
            }
        }
        chats.deleteAll(messages);

        profiles.findByUserId(id).ifPresent(profiles::delete);
        resumes.findByUserId(id).ifPresent(resumes::delete);
        notifications.deleteAll(notifications.findByUserGmailOrderByCreatedAtDesc(user.getGmail()));
        interviews.deleteAll(interviews.findByUserGmailOrderByScheduledAtAsc(user.getGmail()));
        resetTokens.findByGmail(user.getGmail()).ifPresent(resetTokens::delete);

        users.delete(user);
    }
}
