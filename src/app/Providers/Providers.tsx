"use client"

import { PrivyProvider } from "@privy-io/react-auth"
import React from "react"

type ProvidersProps = {
    children: React.ReactNode
}

const Providers: React.FC<ProvidersProps> = ({ children }) => {
    return (
        <PrivyProvider
            appId="cm4mo86ns0465yhrx7fg0whcf"
            config={{
                appearance: {
                    theme: "light",
                    accentColor: "#676FFF",
                    logo: <img src='/icon.png' width={60} height={60}></img>,
                },
                loginMethods: ["email", "google"],
            }}
        >
                    {children}
        </PrivyProvider>
    )
}

export default Providers