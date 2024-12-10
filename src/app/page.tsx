"use client"
import SelectColourPage from "./Components/SelectColourPage"

const Home=()=>{

    return(
      <div className="flex items-center justify-center bg-slate-200 h-screen w-screen">
        <div className="-mt-10">
          <SelectColourPage />
        </div>
      </div>
    )
}

export default Home