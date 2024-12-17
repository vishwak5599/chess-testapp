"use client"
import { useEffect } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { useRouter } from "next/navigation"

import LoginPage from "../app/LoginPage/page"

const Home=()=>{

    const {ready, authenticated, login} = usePrivy()
    const router = useRouter()

    useEffect(() => {
        if(ready && !authenticated) login()
        else if(ready && authenticated) router.push("/HomePage")
    },[ready, authenticated])

    return(
      <div className="flex items-center justify-center h-screen w-screen">
        <LoginPage />
      </div>
    )
}

export default Home