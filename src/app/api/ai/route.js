export const dynamic = "force-dynamic";

import { GoogleGenerativeAI } from "@google/generative-ai";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function POST(req) {
    if (!getSessionUser(req)) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "API Key not configured" },
                { status: 500 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // Fetch recent transactions for context
        const transactions = await prisma.transaction.findMany({
            take: 50,
            orderBy: { timestamp: "desc" },
        });

        const summary = transactions
            .map(
                (t) =>
                    `${t.timestamp.toISOString().split("T")[0]}: ${t.memberName} - ${t.income > 0 ? `Income ${t.income}` : `Expense ${t.expense}`
                    } (${t.note})`
            )
            .join("\n");

        const prompt = `
      Analyze the following financial transactions for "AppFund":
      ${summary}

      Please provide a concise financial summary, identifying trends, total income/expense, and any anomalies. 
      Format as HTML with bold tags for key figures. 
      Keep it encouraging and professional.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ analysis: text });
    } catch (error) {
        console.error("AI Analysis Error:", error);
        return NextResponse.json(
            { error: "Failed to analyze data" },
            { status: 500 }
        );
    }
}
