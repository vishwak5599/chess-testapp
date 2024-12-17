"use client"
import { usePrivy } from "@privy-io/react-auth"

const LoginPage=()=>{
  
  const {ready, authenticated, login} = usePrivy()

      return(
        <div className="flex items-center justify-center h-screen w-screen bg-[url('/images/loginScreenbg.jpeg')] bg-cover bg-center opacity-90 filter brightness-75 contrast-140 saturate-125 grayscale">
          {ready && !authenticated &&
            <div className="flex justify-center items-center">
              <button className="text-lg md:text-xl font-bold text-black bg-white border-4 px-5 py-1 md:py-2 rounded-lg hover:bg-gray-300 transition-all duration-150 ease-in-out border-black shadow-lg shadow-gray-300" onClick={()=>login()}>LOG IN</button>
            </div>
          } 
        </div>
      )
  }

export default LoginPage