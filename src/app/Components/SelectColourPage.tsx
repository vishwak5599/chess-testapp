"use client"
import { useEffect, useState } from "react"
import { GiBulletBill } from "react-icons/gi"
import { useRouter } from "next/navigation"
import { BiSolidChess } from "react-icons/bi"
import { LuAlarmClock } from "react-icons/lu"
import { IoMdArrowDropupCircle, IoMdArrowDropdownCircle } from "react-icons/io"
import { AiFillThunderbolt } from "react-icons/ai"
import { RiArrowDropRightLine, RiArrowDropUpLine, RiArrowDropDownLine } from "react-icons/ri"
import useWindowSize from './UseWindowSize'
import { FaChessRook, FaChessKnight, FaChessBishop, FaChessQueen, FaChessKing, FaChessPawn, FaWindowClose, FaPeopleArrows} from "react-icons/fa"
import { themeAtom } from "../Atoms/ThemeAtom"
import { useAtom } from "jotai"


const SelectColourPage=()=>{

    //atoms
    const [theme, setTheme] = useAtom(themeAtom)

    //hooks
    const windowSize = useWindowSize()
    const router = useRouter()

    const [pieceColour, setPieceColour] = useState(1)
    const [timeType, setTimeType] = useState(0)
    const [preTime,setPreTime] = useState({t:30,i:0})
    const [custTime, setCustTime] = useState({t:60,i:15})
    const [isDropdown, setIsDropdown] = useState(false)
    const [selectRandomPieceColour, setSelectRandomPieceColour] = useState(false)
    const [iconSize, setIconSize] = useState(20)
    const [chooseTheme, setChooseTheme] = useState(false)
    const [selected, setSelected] = useState<{row:number|null,col:number|null}>({row:null,col:null})
    
    const handleStartGame=()=>{
        const time = timeType===0 ? preTime.t : custTime.t
        const increment = timeType===0 ? preTime.i : custTime.i
        router.push(`/GamePage?pieceColour=${pieceColour}&time=${time}&increment=${increment}`)
    }

    const handlePasssNPlayGame=()=>{
        router.push(`/GamePage?pieceColour=${pieceColour}&time=inf&increment=inf`)
    }

    const getSize = () =>{
        return windowSize<640 ? 30 : windowSize<768 ? 34 : windowSize<1024 ? 40 : windowSize<1128 ? 46 : windowSize<1440 ? 48 : windowSize<1800 ? 52 : 52
    }

    const getSize1 = () =>{
        return windowSize<640 ? 26 : windowSize<768 ? 28 : windowSize<1024 ? 30 : windowSize<1128 ? 32 : windowSize<1440 ? 34 : windowSize<1800 ? 34 : 36
    }

    //update width
    useEffect(() => {
        const updateSize = () => {
            if (windowSize<640) {
                setIconSize(20)
            } else if (windowSize<768) {
                setIconSize(24)
            } else if (windowSize<1024) {
                setIconSize(26)
            }
            else {
                setIconSize(28)
            }
        }
        updateSize()
    }, [windowSize])

    const handleDropdown = () => {
        if(!isDropdown){
            setIsDropdown(true)
        }
        else{
            setIsDropdown(false)
        }
    }

    const handleSetTime = (newTime:number,newIncrement:number) => {
        setPreTime(prev => ({
            ...prev,t:newTime,i:newIncrement
        }))
        setIsDropdown(false)
        setTimeType(0)
    }

    const handleSelectPieceColour = (n:number) =>{
        if(n===1 || n===0){
            setPieceColour(n)
            setSelectRandomPieceColour(false)
        }
        else{
            setPieceColour(Math.floor(Math.random()*2))
            setSelectRandomPieceColour(true)
        }
    }

    const themeArray = [
        { l: "#A3B18C", d: "#4A4A4A", s: "#1C1C1C"},   // My Choice
        { l: "#E1B6F4", d: "#8A2BE2", s: "#9C4A94" },  // Light Lavender and Deep Purple
        { l: "#E0C09F", d: "#7A5C47", s: "#A8D1E7" },  // Classic Wood Style
        { l: "#A9C8D8", d: "#2A3E59", s: "#6EC1E4" },  // Elegant Blue Theme
        { l: "#D1D1D1", d: "#4B4B4B", s: "#F8C470" },  // Classic Black and White
        { l: "#A1D3A1", d: "#4C6B2F", s: "#2A4D31" },  // Natural Green Theme
        { l: "#F5A7B8", d: "#E63946", s: "#FF6F61" },  // Soft Pink and Red with Coral
    ]

    let squareStyle = "h-11 w-11 sm:h-11 sm:w-11 md:h-11 md:w-11 lg:h-12 lg:w-12 xl:h-14 xl:w-14 xxl:h-16 xxl:w-16 flex justify-center items-center"


    return(
        <div className="flex flex-col justify-center items-center gap-10 mt-12 md:mt-0">
            <div className="flex justify-center items-center gap-2 -mt-8">
                <BiSolidChess size={34} className="bg-blue-500"/>
                <div className="text-xl md:text-2xl lg:text-3xl text-blue-500 font-extrabold font-anticDidone">CHESS</div>
            </div>
            <div className="flex justify-center font-bold text-lg md:text-xl font-anticDidone -mt-4">CHOOSE YOUR SIDE</div>
                <div className="flex justify-center gap-8 md:gap-10 -mt-8">
                    <button className={`${!selectRandomPieceColour && pieceColour==1 ? " border-blue-500 shadow-lg shadow-blue-500" : "border-white"} p-1 md:p-2 border-4 bg-gray-700 rounded-lg hover:scale-105`} onClick={()=>handleSelectPieceColour(1)}><FaChessKing size={getSize()} color="white"/></button>
                    <button className={`${selectRandomPieceColour ? " border-blue-500 shadow-lg shadow-blue-500" : "border-white"} p-1 md:p-2 border-4 hover:scale-105 bg-gray-300 rounded-lg flex`} onClick={()=>handleSelectPieceColour(2)}><FaChessKing size={getSize()} color="white" style={{clipPath: "polygon(0 0, 50% 0, 50% 100%, 0 100%)"}}/><FaChessKing size={getSize()} color="black" className="absolute" style={{clipPath: "polygon(50% 0, 100% 0, 100% 100%, 50% 100%)"}}/></button>
                    <button className={`${!selectRandomPieceColour && pieceColour==0 ? " border-blue-500 shadow-lg shadow-blue-500" : "border-white"} p-1 md:p-2 border-4 bg-gray-300 rounded-lg hover:scale-105`} onClick={()=>handleSelectPieceColour(0)}><FaChessKing size={getSize()} color="black"/></button>
                </div>
            <div className="flex flex-col justify-center">
                <div className="flex flex-col md:flex-row justify-center items-center -mt-5">
                    <div className={`flex justify-center text-xl font-bold font-anticDidone ${timeType===0 ? "bg-blue-500 hover:bg-blue-600 border-white" : "bg-white hover:bg-slate-200 border-blue-500"} transition-all duration-150 ease-in-out border-4 w-70 md:w-100 px-12 md:px-20 py-1 md:py-2 rounded-lg gap-1 md:gap-1.5`} onClick={()=>setTimeType(0)}>
                        <div>{preTime.t<=2 ? <GiBulletBill color="orange" size={26}/> : preTime.t<=5 ? <AiFillThunderbolt color="gold" size={26}/> : <LuAlarmClock color="green" size={26}/>}</div>
                        <div className={`flex justify-center text-base md:text-lg mt-0.5 md:mt-0 w-20 -ml-1 md:ml-1 ${timeType!==0 ? "text-blue-500" : "text-white"}`}>{preTime.i===0 ? `${preTime.t} min` : `${preTime.t} | ${preTime.i}`}</div>
                        <button className="relative hover:scale-105 ml-2 -mr-8 md:ml-6 md:-mr-12" onClick={()=>handleDropdown()}>{!isDropdown ? <IoMdArrowDropdownCircle size={28} color={`${timeType===0 ? "white" : "#3b82f6"}`}/> : <IoMdArrowDropupCircle size={28} color={`${timeType===0 ? "white" : "#3b82f6"}`}/>}</button>
                        {isDropdown && 
                            <div className="absolute mt-10 justify-center bg-blue-500 border-4 px-4 py-1 rounded-lg border-white">
                                <div className="flex flex-col mt-2">
                                    <div className="flex gap-1 md:gap-2">
                                        <GiBulletBill color="orange"/>
                                        <div className="text-sm md:text-base">BULLET</div>
                                    </div>
                                    <div className="flex gap-1.5 mt-2">
                                        <button className="flex justify-center text-xs md:text-sm font-bold text-white bg-blue-500 hover:bg-blue-600 transition-all duration-150 ease-in-out border-2 w-14 md:w-20 py-2 rounded-lg border-white gap-1" onClick={()=>handleSetTime(1,0)}>1 min</button>
                                        <button className="flex justify-center text-xs md:text-sm font-bold text-white bg-blue-500 hover:bg-blue-600 transition-all duration-150 ease-in-out border-2 w-14 md:w-20 py-2 rounded-lg border-white gap-1" onClick={()=>handleSetTime(1,1)}> 1 | 1</button>
                                        <button className="flex justify-center text-xs md:text-sm font-bold text-white bg-blue-500 hover:bg-blue-600 transition-all duration-150 ease-in-out border-2 w-14 md:w-20 py-2 rounded-lg border-white gap-1" onClick={()=>handleSetTime(2,1)}> 2 | 1</button>
                                    </div>
                                </div>
                                <div className="flex flex-col mt-2">
                                    <div className="flex gap-1 md:gap-2">
                                        <AiFillThunderbolt color="gold"/>
                                        <div className="text-sm md:text-base">BLITZ</div>
                                    </div>
                                    <div className="flex gap-1.5 mt-1">
                                        <button className="flex justify-center text-xs md:text-sm font-bold text-white bg-blue-500 hover:bg-blue-600 transition-all duration-150 ease-in-out border-2 w-14 md:w-20 py-2 rounded-lg border-white gap-1" onClick={()=>handleSetTime(3,0)}>3 min</button>
                                        <button className="flex justify-center text-xs md:text-sm font-bold text-white bg-blue-500 hover:bg-blue-600 transition-all duration-150 ease-in-out border-2 w-14 md:w-20 py-2 rounded-lg border-white gap-1" onClick={()=>handleSetTime(3,2)}>3 | 2</button>
                                        <button className="flex justify-center text-xs md:text-sm font-bold text-white bg-blue-500 hover:bg-blue-600 transition-all duration-150 ease-in-out border-2 w-14 md:w-20 py-2 rounded-lg border-white gap-1" onClick={()=>handleSetTime(5,0)}>5 min</button>
                                    </div>
                                </div>
                                <div className="flex flex-col mt-2 mb-2">
                                    <div className="flex gap-1 md:gap-2">
                                        <LuAlarmClock color="green"/>
                                        <div className="text-sm md:text-base">RAPID</div>
                                    </div>
                                    <div className="flex gap-1.5 mt-1">
                                        <button className="flex justify-center text-xs md:text-sm font-bold text-white bg-blue-500 hover:bg-blue-600 transition-all duration-150 ease-in-out border-2 w-14 md:w-20 py-2 rounded-lg border-white gap-1" onClick={()=>handleSetTime(10,0)}>10 min</button>
                                        <button className="flex justify-center text-xs md:text-sm font-bold text-white bg-blue-500 hover:bg-blue-600 transition-all duration-150 ease-in-out border-2 w-14 md:w-20 py-2 rounded-lg border-white gap-1" onClick={()=>handleSetTime(15,10)}>15 | 10</button>
                                        <button className="flex justify-center text-xs md:text-sm font-bold text-white bg-blue-500 hover:bg-blue-600 transition-all duration-150 ease-in-out border-2 w-14 md:w-20 py-2 rounded-lg border-white gap-1" onClick={()=>handleSetTime(30,0)}>30 min</button>
                                    </div>
                                </div>
                            </div>
                        }
                    </div>
                    <div className="flex justify-center w-[90%] my-3 md:my-0 md:h-14 md:w-0 border-2 border-blue-500 rounded-2xl mx-4"></div>
                    <div className={`flex justify-between border-4 px-6 md:px-10 rounded-lg ${timeType===1 ? "bg-blue-500 hover:bg-blue-600 border-white" : "bg-white hover:bg-slate-200 border-blue-500"}`} onClick={()=>setTimeType(1)}>
                        <div className="flex justify-center items-center -my-2">
                            <div className={`mt-1 text-base font-anticDidone font-black ${timeType===0 ? "text-blue-500" : "text-white"}`}>
                                CUSTOM
                            </div>
                            <RiArrowDropRightLine color={`${timeType===1 ? "white" : "#3b82f6"}`} size={30} className="-ml-1"/>
                            <div className="flex gap-4 font-anticDidone font-bold text-white text-xl">
                                <div className="flex flex-col justify-center items-center">
                                    <button onClick={() => {setCustTime((prev) => {if(prev.t<90){return { ...prev,t:prev.t+1}}return prev})}}><RiArrowDropUpLine size={40} color={`${timeType===1 ? "white" : "#3b82f6"}`} className="-mb-2"/></button>
                                    <div className="flex justify-center items-center bg-gray-400 h-8 w-8 md:h-10 md:w-10 rounded-md">{custTime.t}</div>
                                    <button onClick={() => {setCustTime((prev) => {if(prev.t>0){return {...prev,t:prev.t-1}}return prev})}}><RiArrowDropDownLine size={40} color={`${timeType===1 ? "white" : "#3b82f6"}`} className="-mt-2"/></button>
                                </div>
                                <div className={`flex justify-center items-center mt-6 h-14 border-2 ${timeType===1 ? "white" : "#3b82f6"} rounded-2xl mx-2`}></div>
                                <div className="flex flex-col justify-center items-center">
                                    <button onClick={() => {setCustTime((prev) => {if(prev.i<30){return { ...prev,i:prev.i+1}}return prev})}}><RiArrowDropUpLine size={40} color={`${timeType===1 ? "white" : "#3b82f6"}`} className="-mb-2"/></button>
                                    <div className="flex justify-center items-center bg-gray-400 h-8 w-8 md:h-10 md:w-10 rounded-md">{custTime.i}</div>
                                    <button onClick={() => {setCustTime((prev) => {if(prev.i>0){return {...prev,i:prev.i-1}}return prev})}}><RiArrowDropDownLine size={40} color={`${timeType===1 ? "white" : "#3b82f6"}`} className="-mt-2"/></button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex justify-center mt-2 md:mt-4">
                    <button className="text-lg md:text-xl font-bold text-white font-anticDidone bg-blue-500 border-4 px-5 py-2 rounded-lg hover:bg-blue-600 transition-all duration-150 ease-in-out border-white shadow-lg shadow-blue-500" onClick={()=>handleStartGame()}>START GAME</button>
                </div>
                <div className="flex justify-center items-center"><div className="w-[60%] md:w-[40%] my-3 border-2 border-blue-500 rounded-2xl"></div></div>
                <div className="flex justify-center">
                    <button className="text-base md:text-lg font-bold text-white font-anticDidone bg-blue-500 border-4 px-4 py-2 rounded-lg hover:bg-blue-600 transition-all duration-150 ease-in-out border-white shadow-lg shadow-blue-500" onClick={()=>handlePasssNPlayGame()}><div className="flex justify-center items-center gap-2">PASS N PLAY<div><FaPeopleArrows color="white" size={26}/></div></div></button>
                </div>
                <div className="flex justify-center mt-2 md:mt-4">
                    <button className="text-sm md:text-base font-bold text-white font-anticDidone bg-blue-500 border-4 px-3 py-1 rounded-lg hover:bg-blue-600 transition-all duration-150 ease-in-out border-white shadow-lg shadow-blue-500" onClick={()=>setChooseTheme(true)}>CHANGE THEME</button>
                </div>
            </div>
            {chooseTheme &&
                <div className="absolute flex flex-col bg-white filter brightness-110 border-4 p-2 md:p-3 lg:p-4 border-black rounded-md w-[90%] h-[55%] md:w-[60%] md:h-[65%] lg:w-[50%] lg:h-[75%] animate-expand">
                    <div className="flex flex-col items-end mb-4 lg:mb-10"><button onClick={()=>setChooseTheme(false)}><FaWindowClose color="#3b82f6" size={iconSize}/></button></div>
                    <div className="flex flex-col mb-6 md:mb-10">
                        <div className="flex flex-col justify-center items-center">
                            <div className="border-4 border-black rounded-md">
                            <div className="flex">
                                <div className={`${squareStyle}`} style={{background: (selected!==null && selected.row===0 && selected.col===0) ? themeArray[theme].s : themeArray[theme].l}} onClick={()=>setSelected({row:0,col:0})}><FaChessRook color="black" size={getSize1()}/></div>
                                <div className={`${squareStyle}`} style={{background: (selected!==null && selected.row===0 && selected.col===1) ? themeArray[theme].s : themeArray[theme].d}} onClick={()=>setSelected({row:0,col:1})}><FaChessKnight color="black" size={getSize1()}/></div>
                                <div className={`${squareStyle}`} style={{background: (selected!==null && selected.row===0 && selected.col===2) ? themeArray[theme].s : themeArray[theme].l}} onClick={()=>setSelected({row:0,col:2})}><FaChessBishop color="black" size={getSize1()}/></div>
                                <div className={`${squareStyle}`} style={{background: (selected!==null && selected.row===0 && selected.col===3) ? themeArray[theme].s : themeArray[theme].d}} onClick={()=>setSelected({row:0,col:3})}><FaChessQueen color="black" size={getSize1()}/></div>
                                <div className={`${squareStyle}`} style={{background: (selected!==null && selected.row===0 && selected.col===4) ? themeArray[theme].s : themeArray[theme].l}} onClick={()=>setSelected({row:0,col:4})}><FaChessKing color="black" size={getSize1()}/></div>
                                <div className={`${squareStyle}`} style={{background: (selected!==null && selected.row===0 && selected.col===5) ? themeArray[theme].s : themeArray[theme].d}} onClick={()=>setSelected({row:0,col:5})}><FaChessPawn color="black" size={getSize1()}/></div>
                            </div>
                            <div className="flex">
                                <div className={`${squareStyle}`} style={{background: (selected!==null && selected.row===1 && selected.col===0) ? themeArray[theme].s : themeArray[theme].d}} onClick={()=>setSelected({row:1,col:0})}><FaChessRook color="white" size={getSize1()}/></div>
                                <div className={`${squareStyle}`} style={{background: (selected!==null && selected.row===1 && selected.col===1) ? themeArray[theme].s : themeArray[theme].l}} onClick={()=>setSelected({row:1,col:1})}><FaChessKnight color="white" size={getSize1()}/></div>
                                <div className={`${squareStyle}`} style={{background: (selected!==null && selected.row===1 && selected.col===2) ? themeArray[theme].s : themeArray[theme].d}} onClick={()=>setSelected({row:1,col:2})}><FaChessBishop color="white" size={getSize1()}/></div>
                                <div className={`${squareStyle}`} style={{background: (selected!==null && selected.row===1 && selected.col===3) ? themeArray[theme].s : themeArray[theme].l}} onClick={()=>setSelected({row:1,col:3})}><FaChessQueen color="white" size={getSize1()}/></div>
                                <div className={`${squareStyle}`} style={{background: (selected!==null && selected.row===1 && selected.col===4) ? themeArray[theme].s : themeArray[theme].d}} onClick={()=>setSelected({row:1,col:4})}><FaChessKing color="white" size={getSize1()}/></div>
                                <div className={`${squareStyle}`} style={{background: (selected!==null && selected.row===1 && selected.col===5) ? themeArray[theme].s : themeArray[theme].l}} onClick={()=>setSelected({row:1,col:5})}><FaChessPawn color="white" size={getSize1()}/></div>
                            </div>
                            <div className="flex">
                                <div className={`${squareStyle}`} style={{background: themeArray[theme].l}}></div>
                                <div className={`${squareStyle}`} style={{background: themeArray[theme].d}}></div>
                                <div className={`${squareStyle}`} style={{background: themeArray[theme].l}}></div>
                                <div className={`${squareStyle}`} style={{background: themeArray[theme].d}}></div>
                                <div className={`${squareStyle}`} style={{background: themeArray[theme].l}}></div>
                                <div className={`${squareStyle}`} style={{background: themeArray[theme].d}}></div>
                            </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-center gap-5 w-full flex-wrap mb-6 lg:mb-0">
                        {themeArray.map((key,index)=>(
                            <div key={index} className="flex border-2 border-black rounded-lg" onClick={()=>setTheme(index)}>
                                <div className="w-5 h-5 md:w-8 md:h-8 lg:w-10 lg:h-10" style={{background:themeArray[index].l}}></div>
                                <div className="w-5 h-5 md:w-8 md:h-8 lg:w-10 lg:h-10" style={{background:themeArray[index].d}}></div>
                                <div className="w-5 h-5 md:w-8 md:h-8 lg:w-10 lg:h-10" style={{background:themeArray[index].s}}></div>
                            </div>
                        ))}
                    </div>
                </div>
            }
        </div>
    )
}

export default SelectColourPage