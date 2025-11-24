"use client";

import { SendHorizonal } from "lucide-react";
import { useState } from "react";

const initialForm = {
  fullName: "",
  phone: "",
  email: "",
  content: "",
};

export default function ContactForm() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setStatus(
      "Cảm ơn bạn! Chúng tôi đã nhận được yêu cầu và sẽ phản hồi sớm nhất."
    );
    setForm(initialForm);
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-slate-900">
        Gửi phản hồi cho chúng tôi
      </h2>
      <p className="mt-2 text-slate-600">
        Điền vào biểu mẫu dưới đây. Chúng tôi sẽ tiếp nhận và trả lời trong thời
        gian sớm nhất.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="sr-only" htmlFor="fullName">
            Họ tên
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            placeholder="Họ tên *"
            value={form.fullName}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
          />
        </div>
        <div>
          <label className="sr-only" htmlFor="phone">
            Di động
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            placeholder="Di động *"
            value={form.phone}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
          />
        </div>
        <div>
          <label className="sr-only" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
          />
        </div>
        <div>
          <label className="sr-only" htmlFor="content">
            Nội dung yêu cầu
          </label>
          <textarea
            id="content"
            name="content"
            rows={5}
            placeholder="Nội dung yêu cầu..."
            value={form.content}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
          />
        </div>

        {status && (
          <p className="text-sm text-green-600 bg-green-50 rounded-xl px-4 py-2">
            {status}
          </p>
        )}

        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-red-600 px-8 py-3 font-semibold text-white hover:bg-red-700 transition"
        >
          <SendHorizonal size={18} />
          Gửi thông tin
        </button>
      </form>
    </div>
  );
}

