// src/Pages/Chat/Chat.jsx
import { useParams } from "react-router-dom";
import { MessagingLayout } from "../../Components/Messaging";

export default function Chat() {
  const { otherUserId, otherUserName } = useParams();
  return <MessagingLayout activeUserId={otherUserId} activeUserName={otherUserName ? decodeURIComponent(otherUserName) : ""} />;
}
