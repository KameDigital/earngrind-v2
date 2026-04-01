import React from "react";
import Container from "@/components/layout/Container";
import { Beaker, ShieldCheck, Clock, Users } from "lucide-react";

export default function MethodologySection() {
    const steps = [
        {
            icon: <Beaker className="w-6 h-6 text-blue-600" />,
            title: "Real Money Tested",
            description: "We actually sign up, complete tasks, and cash out. No theoretical earnings."
        },
        {
            icon: <Clock className="w-6 h-6 text-blue-600" />,
            title: "30-Day Evaluation",
            description: "We use each platform for at least a month to account for fluctuations in earning potential."
        },
        {
            icon: <ShieldCheck className="w-6 h-6 text-blue-600" />,
            title: "Payment Verification",
            description: "A platform only gets recommended if the money arrives in our bank or PayPal account."
        },
        {
            icon: <Users className="w-6 h-6 text-blue-600" />,
            title: "Community Sourced",
            description: "We cross-reference our findings with thousands of user reports to ensure consistency."
        }
    ];

    return (
        <section className="py-20 md:py-32 bg-white border-t border-gray-100">
            <Container>
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Our Testing Methodology</h2>
                    <p className="text-lg text-gray-600 leading-relaxed">
                        We don&apos;t just read other people&apos;s reviews. We put in the hours and test every single platform so you don&apos;t have to.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {steps.map((step, i) => (
                        <div key={i} className="flex flex-col items-center text-center p-8 rounded-[2rem] bg-gray-50/50 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                            <div className="w-14 h-14 bg-white shadow-sm border border-gray-100 rounded-2xl flex items-center justify-center mb-6">
                                {step.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
                        </div>
                    ))}
                </div>
            </Container>
        </section>
    );
}
