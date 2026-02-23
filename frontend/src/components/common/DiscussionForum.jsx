import { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import api from "../../services/api";
import toast from "react-hot-toast";

const EMOJI_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "🎉"];

const DiscussionForum = ({ eventId, isRegistered, isOrganizer = false }) => {
	const [messages, setMessages] = useState([]);
	const [loading, setLoading] = useState(true);
	const [newMessage, setNewMessage] = useState("");
	const [sending, setSending] = useState(false);
	const [replyTo, setReplyTo] = useState(null);
	const [replies, setReplies] = useState({});
	const [loadingReplies, setLoadingReplies] = useState({});
	const [showReplyInput, setShowReplyInput] = useState(null);
	const [replyContent, setReplyContent] = useState("");
	const [typingUser, setTypingUser] = useState(null);
	const socketRef = useRef(null);
	const messagesEndRef = useRef(null);
	const typingTimeoutRef = useRef(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	const fetchMessages = useCallback(async () => {
		try {
			setLoading(true);
			const response = await api.get(`/discussion/event/${eventId}`);
			setMessages(response.data.messages || []);
		} catch (error) {
			console.error("Error fetching messages:", error);
		} finally {
			setLoading(false);
		}
	}, [eventId]);

	const fetchReplies = async (messageId) => {
		if (replies[messageId]) {
			// Toggle visibility
			setReplies((prev) => ({ ...prev, [messageId]: null }));
			return;
		}

		try {
			setLoadingReplies((prev) => ({ ...prev, [messageId]: true }));
			const response = await api.get(
				`/discussion/event/${eventId}?parentId=${messageId}`,
			);
			setReplies((prev) => ({ ...prev, [messageId]: response.data.messages }));
		} catch (error) {
			console.error("Error fetching replies:", error);
		} finally {
			setLoadingReplies((prev) => ({ ...prev, [messageId]: false }));
		}
	};

	useEffect(() => {
		// Connect to Socket.IO
		const backendUrl =
			import.meta.env.VITE_API_URL?.replace("/api", "") ||
			"http://localhost:5000";
		socketRef.current = io(backendUrl, {
			withCredentials: true,
		});

		socketRef.current.on("connect", () => {
			socketRef.current.emit("join_event", eventId);
		});

		// Listen for new messages
		socketRef.current.on("new_message", ({ message, parentMessage }) => {
			if (parentMessage) {
				// This is a reply
				setReplies((prev) => {
					if (!prev[parentMessage]) return prev;
					return {
						...prev,
						[parentMessage]: [message, ...prev[parentMessage]],
					};
				});
			} else {
				// This is a top-level message
				setMessages((prev) => [message, ...prev]);
			}
		});

		// Listen for message updates
		socketRef.current.on("message_updated", ({ messageId, content }) => {
			setMessages((prev) =>
				prev.map((m) => (m._id === messageId ? { ...m, content } : m)),
			);
		});

		// Listen for message deletions
		socketRef.current.on("message_deleted", ({ messageId }) => {
			setMessages((prev) => prev.filter((m) => m._id !== messageId));
			setReplies((prev) => {
				const newReplies = { ...prev };
				Object.keys(newReplies).forEach((key) => {
					if (newReplies[key]) {
						newReplies[key] = newReplies[key].filter(
							(r) => r._id !== messageId,
						);
					}
				});
				return newReplies;
			});
		});

		// Listen for pin updates
		socketRef.current.on("message_pinned", ({ messageId, isPinned }) => {
			setMessages((prev) => {
				const updated = prev.map((m) =>
					m._id === messageId ? { ...m, isPinned } : m,
				);
				// Re-sort: pinned first
				return updated.sort((a, b) => {
					if (a.isPinned && !b.isPinned) return -1;
					if (!a.isPinned && b.isPinned) return 1;
					return new Date(b.createdAt) - new Date(a.createdAt);
				});
			});
		});

		// Listen for reaction updates
		socketRef.current.on(
			"reaction_updated",
			({ messageId, reactionCounts }) => {
				setMessages((prev) =>
					prev.map((m) => (m._id === messageId ? { ...m, reactionCounts } : m)),
				);
			},
		);

		// Listen for typing indicators
		socketRef.current.on("user_typing", ({ userName }) => {
			setTypingUser(userName);
		});

		socketRef.current.on("user_stop_typing", () => {
			setTypingUser(null);
		});

		fetchMessages();

		return () => {
			if (socketRef.current) {
				socketRef.current.emit("leave_event", eventId);
				socketRef.current.disconnect();
			}
		};
	}, [eventId, fetchMessages]);

	const handleTyping = () => {
		if (typingTimeoutRef.current) {
			clearTimeout(typingTimeoutRef.current);
		}

		socketRef.current?.emit("typing", {
			eventId,
			userName: "Someone", // In a real app, get from user context
		});

		typingTimeoutRef.current = setTimeout(() => {
			socketRef.current?.emit("stop_typing", { eventId });
		}, 2000);
	};

	const handleSendMessage = async (e) => {
		e.preventDefault();
		if (!newMessage.trim()) return;

		try {
			setSending(true);
			await api.post(`/discussion/event/${eventId}`, {
				content: newMessage.trim(),
			});
			setNewMessage("");
			socketRef.current?.emit("stop_typing", { eventId });
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to send message");
		} finally {
			setSending(false);
		}
	};

	const handleSendReply = async (parentId) => {
		if (!replyContent.trim()) return;

		try {
			setSending(true);
			await api.post(`/discussion/event/${eventId}`, {
				content: replyContent.trim(),
				parentMessage: parentId,
			});
			setReplyContent("");
			setShowReplyInput(null);
			// Fetch replies to show the new one
			const response = await api.get(
				`/discussion/event/${eventId}?parentId=${parentId}`,
			);
			setReplies((prev) => ({ ...prev, [parentId]: response.data.messages }));
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to send reply");
		} finally {
			setSending(false);
		}
	};

	const handleReaction = async (messageId, emoji) => {
		try {
			await api.post(`/discussion/message/${messageId}/reaction`, { emoji });
		} catch (error) {
			toast.error("Failed to react");
		}
	};

	const handleDelete = async (messageId) => {
		if (!confirm("Delete this message?")) return;
		try {
			await api.delete(`/discussion/message/${messageId}`);
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to delete message");
		}
	};

	const handlePin = async (messageId) => {
		try {
			await api.post(`/discussion/message/${messageId}/pin`);
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to pin message");
		}
	};

	if (!isRegistered && !isOrganizer) {
		return (
			<div className='card mt-6'>
				<h3 className='text-lg font-semibold text-white mb-2'>
					💬 Discussion Forum
				</h3>
				<p className='text-gray-400'>
					Register for this event to join the discussion.
				</p>
			</div>
		);
	}

	return (
		<div className='card mt-6'>
			<h3 className='text-lg font-semibold text-white mb-4'>
				💬 Discussion Forum
			</h3>

			{/* Message Input */}
			<form onSubmit={handleSendMessage} className='mb-4'>
				<div className='flex gap-2'>
					<input
						type='text'
						value={newMessage}
						onChange={(e) => {
							setNewMessage(e.target.value);
							handleTyping();
						}}
						placeholder='Type a message...'
						className='flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent'
						maxLength={2000}
					/>
					<button
						type='submit'
						disabled={sending || !newMessage.trim()}
						className='px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed'>
						{sending ? "..." : "Send"}
					</button>
				</div>
			</form>

			{/* Typing Indicator */}
			{typingUser && (
				<p className='text-gray-400 text-sm mb-2'>{typingUser} is typing...</p>
			)}

			{/* Messages */}
			{loading ? (
				<div className='text-center py-8'>
					<div className='inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500'></div>
				</div>
			) : messages.length === 0 ? (
				<p className='text-gray-400 text-center py-8'>
					No messages yet. Start the conversation!
				</p>
			) : (
				<div className='space-y-4 max-h-96 overflow-y-auto'>
					{messages.map((message) => (
						<div key={message._id} className='border-b border-gray-700 pb-4'>
							{/* Message Header */}
							<div className='flex items-start justify-between'>
								<div className='flex items-center gap-2'>
									<span
										className={`font-medium ${
											message.isOrganizer ? "text-primary-400" : "text-white"
										}`}>
										{message.authorName}
									</span>
									{message.isOrganizer && (
										<span className='px-2 py-0.5 text-xs bg-primary-500/20 text-primary-400 rounded'>
											Organizer
										</span>
									)}
									{message.isPinned && (
										<span className='px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded'>
											📌 Pinned
										</span>
									)}
									<span className='text-gray-500 text-xs'>
										{new Date(message.createdAt).toLocaleString()}
									</span>
								</div>

								{/* Actions */}
								<div className='flex gap-2'>
									{isOrganizer && (
										<button
											onClick={() => handlePin(message._id)}
											className='text-gray-400 hover:text-yellow-400 text-sm'
											title={message.isPinned ? "Unpin" : "Pin"}>
											📌
										</button>
									)}
									<button
										onClick={() => handleDelete(message._id)}
										className='text-gray-400 hover:text-red-400 text-sm'
										title='Delete'>
										🗑️
									</button>
								</div>
							</div>

							{/* Message Content */}
							<p className='text-gray-300 mt-1 whitespace-pre-wrap'>
								{message.content}
							</p>

							{/* Reactions */}
							<div className='flex items-center gap-2 mt-2 flex-wrap'>
								{/* Reaction counts */}
								{message.reactionCounts &&
									Object.entries(message.reactionCounts).map(
										([emoji, count]) => (
											<button
												key={emoji}
												onClick={() => handleReaction(message._id, emoji)}
												className={`px-2 py-0.5 text-sm rounded-full ${
													message.userReaction === emoji
														? "bg-primary-500/30 border border-primary-500"
														: "bg-gray-700 hover:bg-gray-600"
												}`}>
												{emoji} {count}
											</button>
										),
									)}
								{/* Add reaction button */}
								<div className='relative group'>
									<button className='px-2 py-0.5 text-sm bg-gray-700 rounded-full hover:bg-gray-600'>
										+
									</button>
									<div className='absolute bottom-full left-0 mb-1 hidden group-hover:flex bg-gray-800 rounded-lg p-1 gap-1 shadow-lg z-10'>
										{EMOJI_OPTIONS.map((emoji) => (
											<button
												key={emoji}
												onClick={() => handleReaction(message._id, emoji)}
												className='hover:bg-gray-700 p-1 rounded'>
												{emoji}
											</button>
										))}
									</div>
								</div>
							</div>

							{/* Reply Section */}
							<div className='mt-2'>
								<button
									onClick={() => {
										if (showReplyInput === message._id) {
											setShowReplyInput(null);
										} else {
											setShowReplyInput(message._id);
											fetchReplies(message._id);
										}
									}}
									className='text-primary-400 hover:text-primary-300 text-sm'>
									💬 {message.replyCount || 0} replies
								</button>

								{/* Replies */}
								{replies[message._id] && (
									<div className='ml-4 mt-2 pl-4 border-l border-gray-700 space-y-2'>
										{replies[message._id].map((reply) => (
											<div key={reply._id} className='text-sm'>
												<div className='flex items-center gap-2'>
													<span
														className={`font-medium ${
															reply.isOrganizer
																? "text-primary-400"
																: "text-white"
														}`}>
														{reply.authorName}
													</span>
													{reply.isOrganizer && (
														<span className='px-1 py-0.5 text-xs bg-primary-500/20 text-primary-400 rounded'>
															Organizer
														</span>
													)}
													<span className='text-gray-500 text-xs'>
														{new Date(reply.createdAt).toLocaleString()}
													</span>
												</div>
												<p className='text-gray-300'>{reply.content}</p>
											</div>
										))}
									</div>
								)}

								{/* Reply Input */}
								{showReplyInput === message._id && (
									<div className='mt-2 flex gap-2'>
										<input
											type='text'
											value={replyContent}
											onChange={(e) => setReplyContent(e.target.value)}
											placeholder='Write a reply...'
											className='flex-1 px-3 py-1 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400'
											maxLength={2000}
										/>
										<button
											onClick={() => handleSendReply(message._id)}
											disabled={sending || !replyContent.trim()}
											className='px-3 py-1 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50'>
											Reply
										</button>
									</div>
								)}
							</div>
						</div>
					))}
					<div ref={messagesEndRef} />
				</div>
			)}
		</div>
	);
};

export default DiscussionForum;
