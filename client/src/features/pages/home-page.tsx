import React, { useState, useRef, useEffect } from "react";
import { Sidebar } from "../../shared/sidebar";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../hooks/redux-hooks";
import { logoutUser } from "../../store/auth-slice";

export const HomePage = () => {
	const [messages, setMessages] = useState<{ role: string; content: string }[]>(
		[]
	);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const navigate = useNavigate();
	const dispatch = useAppDispatch();

	const sampleQuestions = [
		"What is the current stock level of our best-selling products",
		"Which customers haven't made a purchase in the last three months ",
		"Are there any budget overruns in this month's expenses",
		"Which products should we reorder this week based on sales forecasts",
	];

	const handleLogout = async () => {
		try {
			await dispatch(logoutUser()).unwrap();
			navigate("/login");
		} catch (error) {
			console.error("Logout failed:", error);
			navigate("/login");
		}
	};

	useEffect(() => {
		if (messages.length > 0) {
			const messagesContainer = document.querySelector(".messages-container");
			if (messagesContainer) {
				const containerHeight = messagesContainer.clientHeight;
				const scrollHeight = messagesContainer.scrollHeight;

				if (scrollHeight > containerHeight) {
					messagesContainer.scrollTop = scrollHeight - containerHeight + 100;
				}
			}
		}
	}, [messages]);

	const handleSubmit = async (e?: React.FormEvent) => {
		if (e) {
			e.preventDefault();
		}

		if (!input.trim() || loading) return;

		const userMessage = { role: "user", content: input };
		setMessages((prev) => [...prev, userMessage]);
		setInput("");
		setLoading(true);

		try {
			const res = await fetch("http://localhost:3000/api/ask", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ question: input }),
			});

			const data = await res.json();
			const botMessage = { role: "bot", content: data.answer };
			setMessages((prev) => [...prev, botMessage]);
		} catch (err) {
			setMessages((prev) => [
				...prev,
				{ role: "bot", content: "error: " + (err as Error).message },
			]);
		} finally {
			setLoading(false);
		}
	};

	const setAndSubmitQuestion = (question: string) => {
		if (loading) return;
		setInput(question);

		setTimeout(() => {
			const userMessage = { role: "user", content: question };
			setMessages((prev) => [...prev, userMessage]);
			setInput("");
			setLoading(true);

			try {
				fetch("http://localhost:3000/api/ask", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ question }),
				})
					.then((res) => res.json())
					.then((data) => {
						const botMessage = { role: "bot", content: data.answer };
						setMessages((prev) => [...prev, botMessage]);
					})
					.catch((err) => {
						setMessages((prev) => [
							...prev,
							{ role: "bot", content: "error: " + (err as Error).message },
						]);
					})
					.finally(() => {
						setLoading(false);
					});
			} catch (err) {
				setMessages((prev) => [
					...prev,
					{ role: "bot", content: "error: " + (err as Error).message },
				]);
				setLoading(false);
			}
		}, 0);
	};

	return (
		<div className="flex h-screen bg-gradient-to-br from-slate-100 via-indigo-50 to-slate-100">
			<Sidebar />

			<div className="flex-1 flex flex-col">
				<div className="flex items-center justify-between p-4 bg-gradient-to-b from-indigo-50/90 to-slate-50/90">
					<div className="flex items-center">
						<MessageSquare size={24} className="text-slate-700 mr-2" />
						<h2 className="font-medium text-slate-700">New Conversation</h2>
					</div>
					<button
						onClick={handleLogout}
						className="px-4 py-1.5 text-sm bg-[#7B7EF4] text-white rounded-full hover:bg-[#6B6EE4] transition-colors"
					>
						Logout
					</button>
				</div>

				<div className="flex-1 overflow-y-auto bg-gradient-to-b from-indigo-50/90 to-slate-50/90 pb-24">
					<div className="max-w-4xl mx-auto px-4">
						{messages.length === 0 ? (
							<div className="flex flex-col items-center justify-center min-h-[500px] text-slate-700 space-y-8">
								<p className="text-xl font-medium">
									Send a message to start conversation
								</p>

								{/* Sample questions between title and input */}
								<div className="flex flex-wrap justify-center gap-4 max-w-4xl w-full">
									{sampleQuestions.map((question, index) => (
										<button
											key={index}
											onClick={() => setAndSubmitQuestion(question)}
											className="p-3 bg-white border border-indigo-100 rounded-lg shadow-sm hover:bg-indigo-50/80 hover:border-indigo-200 transition-colors text-sm text-slate-700 text-center w-[160px] h-[80px] flex items-center justify-center"
										>
											{question}
										</button>
									))}
								</div>

								{/* Input section - narrower width, taller height */}
								<div className="w-full max-w-2xl">
									<div 
										className="rounded-xl p-[1px] transition-all duration-300"
										style={{ background: 'rgb(199 210 254)' }}
										id="input-container"
									>
										<form onSubmit={handleSubmit} className="relative">
											<input
												type="text"
												value={input}
												onChange={(e) => setInput(e.target.value)}
												placeholder="Type your message..."
												disabled={loading}
												className={`
									w-full py-6 px-4 pr-14
									rounded-xl
									bg-white
									text-indigo-600
									placeholder-indigo-400
									border-none
									outline-none
									shadow-lg
									transition-all duration-300
									text-base
									${loading ? "opacity-50 cursor-not-allowed" : ""}
								`}
												onFocus={(e) => {
													const container = document.getElementById('input-container');
													if (container) {
														container.style.background = 'linear-gradient(135deg, #8B5CF6, #6366F1, #3B82F6)';
													}
												}}
												onBlur={(e) => {
													const container = document.getElementById('input-container');
													if (container) {
														container.style.background = 'rgb(199 210 254)';
													}
												}}
											/>
											<button
												type="submit"
												disabled={loading || !input.trim()}
												className={`
									absolute right-4 top-1/2 transform -translate-y-1/2
									text-indigo-600
									hover:text-indigo-700
									transition-colors
									disabled:opacity-50
									disabled:cursor-not-allowed
								`}
											>
												{loading ? (
													<Loader2 className="w-6 h-6 animate-spin" />
												) : (
													<Send className="w-6 h-6" />
												)}
											</button>
										</form>
									</div>
								</div>
							</div>
						) : (
							<div className="pt-4 space-y-2">
								{messages.map((msg, idx) => (
									<div key={idx} className="mb-1" data-message-index={idx}>
										{msg.role === "user" ? (
											<div className="flex justify-end mb-1">
												<div className="bg-indigo-300 text-white p-2 rounded-lg text-sm max-w-[80%]">
													{msg.content}
												</div>
											</div>
										) : (
											<div className="flex justify-center mb-2">
												<div
													className={`
                          text-indigo-700 text-sm p-3 
                          bg-white/80 rounded-lg shadow-sm 
                          max-w-[80%] 
                          ${loading ? "animate-pulse" : ""}
                        `}
												>
													{msg.content}
												</div>
											</div>
										)}
									</div>
								))}
								<div ref={messagesEndRef} />
							</div>
						)}
					</div>
				</div>

				{/* Input section for when there are messages - stays at bottom */}
				{messages.length > 0 && (
					<div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4">
						<div 
							className="rounded-xl p-[1px] transition-all duration-300"
							style={{ background: 'rgb(199 210 254)' }}
							id="input-container-bottom"
						>
							<form onSubmit={handleSubmit} className="relative">
								<input
									type="text"
									value={input}
									onChange={(e) => setInput(e.target.value)}
									placeholder="Type your message..."
									disabled={loading}
									className={`
						w-full py-6 px-4 pr-14
						rounded-xl
						bg-white
						text-indigo-600
						placeholder-indigo-400
						border-none
						outline-none
						shadow-lg
						transition-all duration-300
						text-base
						${loading ? "opacity-50 cursor-not-allowed" : ""}
					`}
									onFocus={(e) => {
										const container = document.getElementById('input-container-bottom');
										if (container) {
											container.style.background = 'linear-gradient(135deg, #8B5CF6, #6366F1, #3B82F6)';
										}
									}}
									onBlur={(e) => {
										const container = document.getElementById('input-container-bottom');
										if (container) {
											container.style.background = 'rgb(199 210 254)';
										}
									}}
								/>
								<button
									type="submit"
									disabled={loading || !input.trim()}
									className={`
						absolute right-4 top-1/2 transform -translate-y-1/2
						text-indigo-600
						hover:text-indigo-700
						transition-colors
						disabled:opacity-50
						disabled:cursor-not-allowed
					`}
								>
									{loading ? (
										<Loader2 className="w-6 h-6 animate-spin" />
									) : (
										<Send className="w-6 h-6" />
									)}
								</button>
							</form>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};