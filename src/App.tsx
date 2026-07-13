  import ChatbotWidget from './chatbot/ChatbotWidget';
  import { Routes, Route } from "react-router-dom";
  import { RootLayout, NotFoundComponent } from "./routes/__root";

  import { Route as IndexRoute } from "./routes/index";
  import { Route as LoginRoute } from "./routes/login";
  import { Route as RegisterRoute } from "./routes/register";
  import { Route as ForgotRoute } from "./routes/forgot-password";
  import { Route as ResetRoute } from "./routes/reset-password";
  import { Route as MentorsRoute } from "./routes/mentors";
  import { Route as MentorDetailRoute } from "./routes/mentors_.$id";
  import { Route as BookRoute } from "./routes/book.$mentorId";
  import { Route as DashAdminRoute } from "./routes/dashboard.admin";
  import { Route as DashMenteeRoute } from "./routes/dashboard.mentee";
  import { Route as DashMentorRoute } from "./routes/dashboard.mentor";
  import { Route as MenteeDetailRoute } from "./routes/mentees.$id";
  import { Route as NotificationsRoute } from "./routes/notifications";
  import { Route as SettingsRoute } from "./routes/settings";
  import { Route as AiAssistantRoute } from "./routes/ai-assistant";

  export default function App() {
    return (
      <RootLayout>
        <Routes>
          <Route path="/" element={<IndexRoute.component />} />
          <Route path="/login" element={<LoginRoute.component />} />
          <Route path="/register" element={<RegisterRoute.component />} />
          <Route path="/forgot-password" element={<ForgotRoute.component />} />
          <Route path="/reset-password" element={<ResetRoute.component />} />
          <Route path="/mentors" element={<MentorsRoute.component />} />
          <Route path="/mentors/:id" element={<MentorDetailRoute.component />} />
          <Route path="/book/:mentorId" element={<BookRoute.component />} />
          <Route path="/dashboard/admin" element={<DashAdminRoute.component />} />
          <Route path="/dashboard/mentee" element={<DashMenteeRoute.component />} />
          <Route path="/dashboard/mentor" element={<DashMentorRoute.component />} />
          <Route path="/mentees/:id" element={<MenteeDetailRoute.component />} />
          <Route path="/notifications" element={<NotificationsRoute.component />} />
          <Route path="/settings" element={<SettingsRoute.component />} />
          <Route path="/ai-assistant" element={<AiAssistantRoute.component />} />
          <Route path="*" element={<NotFoundComponent />} />
        </Routes>
        <ChatbotWidget />
      </RootLayout>
    );
  }
