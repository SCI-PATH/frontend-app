import { SocraticChatView } from "@/components/features/learner-analytics/SocraticChatView";

export const metadata = {
  title: "Socrates | SCI-PATH",
  description:
    "Chat with Socrates, your AI science companion, in Socratic mode.",
};

export default function TutorPage() {
  return (
    <main className="flex flex-1 flex-col items-center px-4 py-6 sm:px-6">
      <div className="flex w-full max-w-3xl flex-1 flex-col">
        <SocraticChatView />
      </div>
    </main>
  );
}
