import React from "react";
import { ChatCompletionRequestMessage } from "openai";
import ChatBubble from "./ChatBubble";

type Props = {
  messages: ChatCompletionRequestMessage[];
};

export const ChatBubbleList = ({ messages }: Props) => {
  const chatContainerRef = React.useRef(null);

  React.useEffect(() => {
    if (chatContainerRef.current) {
      const chatContainer = chatContainerRef.current;
      const scrollHeight = chatContainer.scrollHeight;
      const clientHeight = chatContainer.clientHeight;

      chatContainer.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  return (
    <div className="w-full h-full overflow-y-scroll" ref={chatContainerRef}>
      {messages.map((message, index) => (
        <ChatBubble
          key={index}
          role={message.role}
          content={message.content}
          name={message.name}
          index={index}
        />
      ))}
    </div>
  );
};

export default ChatBubbleList;