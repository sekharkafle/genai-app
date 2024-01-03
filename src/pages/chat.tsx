import { ChatWindow } from "@/components/ChatWindow";
import { IntermediateStep } from "@/components/IntermediateStep";

export default function Home() {
  const InfoCard = (
    <div ></div>
  );
  return (
    <ChatWindow
      endpoint="api/chat"
      emoji=""
      titleText="Chatty Assistant"
      placeholder="I'm an LLM pretending to be a pirate! Ask me about the pirate life!"
      emptyStateComponent={InfoCard}
    ></ChatWindow>
  );
}