import React, { useState, useRef, useEffect } from "react";
import { Sidebar } from "../../shared/sidebar";
import { MessageSquare, Send, Loader2, Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../hooks/redux-hooks";
import { logoutUser } from "../../store/auth-slice";

export const HomePage = () => {
	const [messages, setMessages] = useState<{ role: string; content: string }[]>(
		[]
	);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const navigate = useNavigate();
	const dispatch = useAppDispatch();

	const sampleQuestions = [
		"What is the current stock level of our best-selling products",
		"Which customers haven't made a purchase in the last three months",
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
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	const handleSubmit = async (e?: React.FormEvent, customInput?: string) => {
		if (e) e.preventDefault();
		const finalInput = customInput ?? input;

		if (!finalInput.trim() || loading) return;

		const userMessage = { role: "user", content: finalInput };
		setMessages((prev) => [...prev, userMessage]);
		setInput("");
		setLoading(true);

		try {
			const res = await fetch("http://localhost:3000/api/ask", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ question: finalInput }),
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
		setInput("");
		handleSubmit(undefined, question);
	};

	return (
		<div className="flex h-screen bg-gradient-to-br from-slate-100 via-indigo-50 to-slate-100">
<div className="hidden md:block">
	<Sidebar />
</div>


<div className={`
	fixed md:hidden inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out
	${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
`}>
	<Sidebar forceOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
</div>
			<div className="flex-1 flex flex-col">
				<div className="flex items-center justify-between p-4 bg-gradient-to-b from-indigo-50/90 to-slate-50/90">
					<div className="flex items-center">
						<button
							onClick={() => setSidebarOpen(!sidebarOpen)}
							className="md:hidden mr-2 p-1 rounded-md hover:bg-slate-200 transition-colors"
						>
							{sidebarOpen ? <X size={20} /> : <Menu size={20} />}
						</button>
						
						<MessageSquare size={24} className="text-slate-700 mr-2" />
						<h2 className="font-medium text-slate-700">New Conversation</h2>
					</div>
					<button
						onClick={handleLogout}
						className="px-4 py-1.5 text-sm text-white rounded-full bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 hover:opacity-90 transition-all"
					>
						Logout
					</button>
				</div>

				<div className="flex-1 overflow-y-auto bg-gradient-to-b from-indigo-50/90 to-slate-50/90 pb-24">
					<div className="max-w-4xl mx-auto h-full">
						{messages.length === 0 ? (
							<div className="h-full flex items-center justify-center">
								<div className="flex flex-col items-center text-slate-700 space-y-8 -mt-20">
									<p className="text-xl font-medium">
										Send a message to start conversation
									</p>
									<div className="flex flex-wrap justify-center gap-4 max-w-2xl w-full mx-auto px-4 md:px-0">
										{sampleQuestions.map((question, index) => (
											<button
												key={index}
												onClick={() => setAndSubmitQuestion(question)}
												className="p-6 bg-white border border-indigo-100 rounded-lg shadow-sm hover:bg-indigo-50/80 hover:border-indigo-200 transition-colors text-xs text-slate-700 text-center w-full sm:w-[152px] h-[100px] flex items-center justify-center leading-tight px-3"
											>
												{question}
											</button>
										))}
									</div>
									<div className="w-full max-w-2xl px-4 md:px-0">
										<MessageInput
											input={input}
											setInput={setInput}
											handleSubmit={handleSubmit}
											loading={loading}
										/>
									</div>
								</div>
							</div>
						) : (
							<div className="h-[calc(100vh-200px)] overflow-hidden -ml-[9%]">
								<div className="max-w-2xl mx-auto h-full overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
									<div className="pt-4 space-y-4 flex flex-col px-4" style={{minWidth: 0, width: '100%'}}>
										{messages.map((msg, idx) => (
											<div key={idx} className="animate-fade-in mb-4 w-full">
												{msg.role === "user" ? (
													<div className="flex justify-end mb-2">
														<div className="bg-indigo-300 text-white p-3.5 rounded-xl text-sm max-w-[85%] md:max-w-full break-all hyphens-auto" style={{wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap', minWidth: 0}}>
															{msg.content}
														</div>
													</div>
												) : (
													<div className="flex justify-end md:justify-end mb-2">
														<div className="text-slate-700 p-3.5 text-sm max-w-[85%] md:max-w-full break-all hyphens-auto" style={{wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap', minWidth: 0}}>
															{msg.content}
														</div>
													</div>
												)}
											</div>
										))}

										{loading && (
											<div className="flex justify-start md:justify-end mb-2">
												<div className="text-slate-700 p-3 text-sm">
													<div className="flex items-center space-x-2">
														<Loader2 className="w-4 h-4 animate-spin" />
														<span>Thinking...</span>
													</div>
												</div>
											</div>
										)}
										<div ref={messagesEndRef} className="h-4" />
									</div>
								</div>
							</div>
						)}
					</div>
				</div>

				{messages.length > 0 && (
					<div className="fixed bottom-4 left-4 right-4 md:absolute md:bottom-6 md:left-1/2 md:transform md:-translate-x-1/2 md:w-full md:max-w-2xl md:px-4">
						<MessageInput
							input={input}
							setInput={setInput}
							handleSubmit={handleSubmit}
							loading={loading}
						/>
					</div>
				)}
			</div>
		</div>
	);
};

const MessageInput = ({
	input,
	setInput,
	handleSubmit,
	loading,
}: {
	input: string;
	setInput: React.Dispatch<React.SetStateAction<string>>;
	handleSubmit: (e?: React.FormEvent) => void;
	loading: boolean;
}) => {
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
			const maxHeight = 216; 
			const scrollHeight = textareaRef.current.scrollHeight;
			textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
		}
	}, [input]);

	return (
		<div
			className="rounded-xl p-[1px] transition-all duration-300 relative"
			style={{ background: "rgb(199 210 254)" }}
			id="input-container-bottom"
		>
			<form onSubmit={handleSubmit} className="relative">
				<div className="relative">
					{textareaRef.current && textareaRef.current.scrollHeight > 216 && (
						<div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white via-white to-transparent z-10" />
					)}
					<textarea
						ref={textareaRef}
						value={input}
						onChange={(e) => setInput(e.target.value)}
						placeholder="Type your message..."
						disabled={loading}
						rows={1}
						className={`w-full py-6 px-4 pr-14 rounded-xl bg-white text-slate-900 
              placeholder-slate-600 border-none outline-none shadow-lg transition-all 
              text-base resize-none max-h-[216px] overflow-y-auto
              [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
              ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
						onFocus={() => {
							const container = document.getElementById("input-container-bottom");
							if (container)
								container.style.background =
									"linear-gradient(135deg, #8B5CF6, #6366F1, #3B82F6)";
						}}
						onBlur={() => {
							const container = document.getElementById("input-container-bottom");
							if (container) container.style.background = "rgb(199 210 254)";
						}}
						onKeyDown={(e) => {
							if (e.key === "Enter" && !e.shiftKey) {
								e.preventDefault();
								handleSubmit();
							}
						}}
					/>
				</div>
				<button
					type="submit"
					disabled={loading || !input.trim()}
					className="absolute right-4 top-6 text-slate-900 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{loading ? (
						<Loader2 className="w-6 h-6 animate-spin" />
					) : (
						<Send className="w-6 h-6" />
					)}
				</button>
			</form>
		</div>
	);
};

export default HomePage;