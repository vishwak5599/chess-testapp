"use client"
import { useEffect, useState } from "react"
import { GiBulletBill } from "react-icons/gi"
import { BsRobot } from "react-icons/bs"
import { useRouter } from "next/navigation"
import { LuAlarmClock } from "react-icons/lu"
import { IoMdArrowDropupCircle, IoMdArrowDropdownCircle, IoMdArrowRoundBack } from "react-icons/io"
import { AiFillThunderbolt } from "react-icons/ai"
import { RiArrowDropRightLine, RiArrowDropUpLine, RiArrowDropDownLine } from "react-icons/ri"
import { MdDoneOutline, MdQuestionMark } from "react-icons/md"
import { ImCross } from "react-icons/im"
import { IoNotificationsSharp } from "react-icons/io5"
import { FaClipboard, FaClipboardCheck } from "react-icons/fa"
import useWindowSize from "../Components/UseWindowSize"
import { FaChessRook, FaChessKnight, FaChessBishop, FaChessQueen, FaChessKing, FaChessPawn, FaWindowClose, FaPeopleArrows, FaUser} from "react-icons/fa"
import { themeAtom } from "../Atoms/ThemeAtom"
import { useAtom } from "jotai"
import Image from "next/image"
import { usePrivy } from "@privy-io/react-auth"
import {io} from "socket.io-client"


const HomePage=()=>{

    //atoms
    const [theme, setTheme] = useAtom(themeAtom)

    //hooks
    const windowSize = useWindowSize()
    const router = useRouter()
    const {user, ready, authenticated, logout} = usePrivy()

    const [pieceColour, setPieceColour] = useState(1)
    const [timeType, setTimeType] = useState(0)
    const [preTime,setPreTime] = useState<{t:number|string,i:number}>({t:30,i:0})
    const [custTime, setCustTime] = useState({t:60,i:15})
    const [isDropdown, setIsDropdown] = useState(false)
    const [selectRandomPieceColour, setSelectRandomPieceColour] = useState(false)
    const [iconSize, setIconSize] = useState(20)
    const [chooseTheme, setChooseTheme] = useState(false)
    const [selected, setSelected] = useState<{row:number|null,col:number|null}>({row:null,col:null})
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
    const [socket, setSocket] = useState<any>(undefined)
    const [playOnlinePopup, setPlayOnlinePopup] = useState(false)
    const [sendRequestUserId, setSendRequestUserId] = useState("")
    const [incomingRequests, setIncomingRequests] = useState<{fromUserId:String,fromUserName:String,fromPieceColour:number}[]>([])
    const [copied, setCopied] = useState(false)
    const [isBotDialogOpen, setIsBotDialogOpen] = useState(false)
    const [selectedBot, setSelectedBot] = useState(0)

    const depthEloArr = [
        {depth:1,elo:1000},
        {depth:2,elo:1250},
        {depth:4,elo:1450},
        {depth:8,elo:1950},
        {depth:10,elo:2150},
        {depth:11,elo:2250},
        {depth:12,elo:2350},
        {depth:13,elo:2450},
        {depth:14,elo:2500},
        {depth:15,elo:2550}
    ]

    useEffect(()=>{
        const socket = io("https://chesstestbackend.onrender.com/")
        setSocket(socket)
        socket.on('gameRequest', ({fromUserId,fromUserName,fromPieceColour})=>{
            setIncomingRequests((prev)=>{
                if(prev.some((req)=>req.fromUserId===fromUserId && req.fromUserName===fromUserName && req.fromPieceColour===fromPieceColour)){
                    return prev
                }
                return [...prev,{fromUserId,fromUserName,fromPieceColour}]
            })
            // setTimeout(()=>{
            //     setIncomingRequests((prev)=>{
            //         return prev.filter((req)=>req.fromUserId!==fromUserId && req.fromUserName!==fromUserName)
            //     })
            // },20000)
        })
        socket.on('requestAccepted', ({acceptedUserId,acceptedUserName,requestedPieceColour})=>{
            router.push(`/GamePage?pieceColour=${requestedPieceColour}&time=inf&increment=inf&oppoUid=${acceptedUserId}&oppoUname=${acceptedUserName}`)
        })
        return () => {
            socket.disconnect()
        }
    },[])

    const handleSendRequest = () => {
        socket.emit("sendRequest",user?.id.split(":")[2],user?.google?.name,sendRequestUserId,pieceColour)
        setPlayOnlinePopup(false)
    }

    const handleAcceptIncomingRequest = (fromUserId:String,fromUserName:String,fromPieceColour:number) =>{
        socket.emit("acceptRequest",user?.id.split(":")[2],user?.google?.name,fromUserId,fromPieceColour)
        if(fromPieceColour===1) router.push(`/GamePage?pieceColour=0&time=inf&increment=inf&oppoUid=${fromUserId}&oppoUname=${fromUserName}`)
        else router.push(`/GamePage?pieceColour=1&time=inf&increment=inf&oppoUid=${fromUserId}&oppoUname=${fromUserName}`)
    }

    const handleRejectIncomingRequest = (userId:String) =>{
        setIncomingRequests((prev)=>{
            return prev.filter((req)=>(
                req.fromUserId!==userId
            ))
        })
    }
    
    const handleStartGame=()=>{
        const time = timeType===0 ? preTime.t : custTime.t
        const increment = timeType===0 ? preTime.i : custTime.i
        if(time==="inf") router.push(`/GamePage?pieceColour=${pieceColour}&time=inf&increment=inf`)
        else router.push(`/GamePage?pieceColour=${pieceColour}&time=${time}&increment=${increment}`)
    }

    const getSize = () =>{
        return windowSize<640 ? 30 : windowSize<768 ? 34 : windowSize<1024 ? 40 : windowSize<1128 ? 46 : windowSize<1440 ? 48 : windowSize<1800 ? 52 : 52
    }

    const getSize1 = () =>{
        return windowSize<640 ? 26 : windowSize<768 ? 28 : windowSize<1024 ? 30 : windowSize<1128 ? 32 : windowSize<1440 ? 34 : windowSize<1800 ? 34 : 36
    }

    const getSizeLogo = () =>{
        return windowSize<640 ? 44 : windowSize<768 ? 52 : windowSize<1024 ? 60 : windowSize<1128 ? 70 : windowSize<1440 ? 72 : windowSize<1800 ? 72 : 74
    }

    const getSizeArrow = () =>{
        return windowSize<680 ? 22 : windowSize<768 ? 24 : windowSize<1024 ? 26 : windowSize<1128 ? 28 : windowSize<1440 ? 30 : windowSize<1800 ? 30 : 32
    }

    const getSizeYes = () =>{
        return windowSize<680 ? 16 : windowSize<768 ? 20 : windowSize<1024 ? 26 : windowSize<1128 ? 28 : windowSize<1440 ? 30 : windowSize<1800 ? 30 : 32
    }

    const getSizeNo = () =>{
        return windowSize<680 ? 16 : windowSize<768 ? 18 : windowSize<1024 ? 22 : windowSize<1128 ? 24 : windowSize<1440 ? 26 : windowSize<1800 ? 26 : 28
    }

    const getSizeBotImage = () =>{
        return windowSize<680 ? 80 : windowSize<768 ? 100 : windowSize<1024 ? 120 : windowSize<1128 ? 130 : windowSize<1440 ? 150 : windowSize<1800 ? 150 : 160
    }

    useEffect(()=>{
        if(ready && !authenticated){
            socket.emit("customDisconnect")
            router.push("/")

        }
        else if(ready && authenticated && socket){
            socket.emit("register",user?.id.split(":")[2])
        }
    },[ready, authenticated, socket])

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

    const handleSetTime = (newTime:number|string,newIncrement:number) => {
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

    const handleCopy = async () => {
        try {
            if(user){
                await navigator.clipboard.writeText(user.id.split(":")[2])
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
            }
        } catch (error) {
          console.error('Failed to copy: ', error)
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
        <div className={`${!(isProfileOpen || isNotificationsOpen) ? "pt-12" : "overflow-hidden"} relative`}>
            {isProfileOpen ? 
            <div className="flex flex-col pb-2 md:pb-4 animate-slideLeft w-screen h-screen">
                <button onClick={()=>setIsProfileOpen(false)} className="flex items-center m-2 md:m-4"><IoMdArrowRoundBack size={getSizeArrow()}/></button>
                <div className="flex flex-col justify-center items-center">
                    <div>
                        {user && user.google && user.google.name ? (
                            <figure className='h-14 w-14 sm:h-12 sm:w-12 lg:h-20 lg:w-20 outline-none rounded-full flex items-center justify-center bg-gray-600 text-white text-xl text-center font-bold'>
                                <div className='pt-0.5 lg:pt-1.5 text-3xl lg:text-5xl'>
                                    <div>{user.google.name[0].toUpperCase()}</div>
                                </div>
                            </figure>
                        ) : (
                            <div><FaUser size={getSizeLogo()} color="#4b5563" className="border-2 border-gray-400 rounded-full p-0.5 md:p-1 mr-2 md:mr-5"/></div>
                        )}
                    </div>
                    <div className="flex flex-col justify-center items-center mt-10">
                        <div className="flex flex-col gap-4 justify-center items-center text-sm md:text-xl font-bold font-anticDidone text-black">
                            <div className="flex justify-center items-center gap-1 md:gap-2 w-screen">
                                <div>USERID  :</div><div className="w-[65%] md:w-[38%] border-2 border-black px-2 py-1 rounded-md">{user?.id.split(":")[2]}</div>
                                <div onClick={()=>handleCopy()} className={`flex justify-center items-center cursor-pointer border-2 ${copied ? "border-green-700 shadow-green-700" : "border-black shadow-black"} rounded-md shadow-sm p-1`}>{!copied ? <FaClipboard size={getSizeNo()+2}/> : <FaClipboardCheck size={getSizeNo()+2} color="green"/>}</div>
                            </div>
                            <div className="flex justify-center items-center gap-1 md:gap-2 w-screen">
                                <div>NAME  :</div><div className="w-[70%] md:w-[40%] border-2 border-black px-2 py-1 rounded-md">{user?.google?.name}</div>
                            </div>
                            <div className="flex justify-center items-center gap-1 md:gap-2 w-screen">
                                <div>EMAIL :</div><div className="w-[70%] md:w-[40%] border-2 border-black px-2 py-1 rounded-md">{user?.google?.email}</div>
                            </div>
                            </div>
                        <div className="flex justify-center mt-6 lg:mt-8">
                            <button className="text-lg md:text-xl font-bold text-gray-600 font-anticDidone bg-white border-4 px-5 py-1 md:py-2 rounded-lg hover:bg-gray-200 transition-all duration-150 ease-in-out border-gray-600 shadow-lg shadow-gray-200" onClick={()=>logout()}>LOG OUT</button>
                        </div>
                    </div>
                </div>
            </div> :
            isNotificationsOpen ? 
            <div className="overflow-x-hidden pb-10 md:pb-16">
                <div className="flex flex-col animate-slideLeft w-screen h-screen">
                    <button onClick={()=>setIsNotificationsOpen(false)} className="flex items-center m-2 md:m-4"><IoMdArrowRoundBack size={getSizeArrow()}/></button>
                    <div className="flex justify-center items-center font-extrabold font-anticDidone text-lg md:text-3xl">GAME REQUESTS</div>
                    <div className="flex flex-col justify-center items-center mt-5 gap-2">
                    {incomingRequests.length>0 && incomingRequests.map((req,index)=>(
                        <div key={index} className="flex justify-center items-center w-[90%] md:w-[70%] lg:w-[50%] py-2 px-[1%] rounded-md text-xs md:text-lg font-anticDidone font-bold border-2 border-black bg-white">
                            <div className="flex gap-10">
                                <div className="flex justify-center items-center pl-2">
                                    <div className="flex flex-col md:flex-row md:gap-1.5 text-center md:text-start"><div className="text-blue-600">{req.fromUserName}</div>wants to play with you</div>
                                </div>
                                <div className="flex ml-auto pr-2 gap-2 items-center justify-center">
                                    <div onClick={()=>handleAcceptIncomingRequest(req.fromUserId,req.fromUserName,req.fromPieceColour)} className="cursor-pointer border-2 border-green-600 rounded-md p-0.5 md:p-1.5"><MdDoneOutline size={getSizeYes()} color="green"/></div>
                                    <div onClick={()=>handleRejectIncomingRequest(req.fromUserId)} className="cursor-pointer border-2 border-red-600 rounded-md p-0.5 md:p-2"><ImCross size={getSizeNo()} color="red"/></div>
                                </div>
                            </div>
                        </div>
                    ))}
                    </div>
                </div>
            </div> :
            <div>
                <div className="absolute z-10 inset-0 h-screen w-screen bg-[url('/images/loginScreenbg.jpeg')] bg-cover bg-center opacity-90 filter brightness-75 contrast-140 saturate-125 grayscale"></div>
                <div className="relative z-10 flex flex-col justify-center items-center gap-10 mt-10 md:mt-0">
                    <div className="flex flex-grow justify-between items-center -mt-8 pl-14 md:pl-28 w-screen">
                        <div className="flex justify-center items-center flex-grow">
                            <Image src={"/images/icon.png"} alt={"logo"} width={getSizeLogo()} height={getSizeLogo()}></Image>
                            <div className="text-xl md:text-2xl lg:text-3xl text-white font-extrabold font-anticDidone -ml-2 md:-ml-4">CHESS</div>
                        </div>
                        <div className="relative flex ml-auto items-center">
                            <IoNotificationsSharp onClick={()=>setIsNotificationsOpen(true)} size={getSize()} color="white" className="cursor-pointer border-2 border-white rounded-full p-0.5 md:p-1 mr-2 md:mr-5"/>
                            {incomingRequests.length > 0 && (
                                <div className="absolute top-0 right-1 md:right-4 bg-red-600 text-white text-xs md:text-sm font-bold rounded-full h-4 w-4 md:h-5 md:w-5 flex items-center justify-center">
                                    {incomingRequests.length}
                                </div>
                            )}
                        </div>
                        <div className="cursor-pointer flex ml-auto items-center justify-start"><FaUser onClick={()=>setIsProfileOpen(true)} size={getSize()} color="white" className="border-2 border-white rounded-full p-0.5 md:p-1 mr-2 md:mr-5"/></div>
                    </div>
                    <div className="flex justify-center font-bold text-lg md:text-xl font-anticDidone -mt-10 md:-mt-8">CHOOSE YOUR SIDE</div>
                        <div className="flex justify-center gap-8 md:gap-10 -mt-8">
                            <button className={`${!selectRandomPieceColour && pieceColour==1 ? " border-white shadow-lg shadow-white" : "border-gray-400"} p-1 md:p-2 border-4 bg-gray-500 rounded-lg hover:scale-105`} onClick={()=>handleSelectPieceColour(1)}><FaChessKing size={getSize()} color="white"/></button>
                            <button className={`${selectRandomPieceColour ? " border-white shadow-lg shadow-white" : "border-gray-400"} relative p-1 md:p-2 border-4 hover:scale-105 bg-gray-300 rounded-lg flex`} onClick={()=>handleSelectPieceColour(2)}><FaChessKing size={getSize()} color="white" style={{clipPath: "polygon(0 0, 50% 0, 50% 100%, 0 100%)"}}/><MdQuestionMark size={getSizeNo()} color="black" style={{clipPath: "polygon(0 0, 50% 0, 50% 100%, 0 100%)"}} className="absolute top-[35%] left-[30%]" /><MdQuestionMark size={getSizeNo()} color="white" style={{clipPath: "polygon(50% 0, 100% 0, 100% 100%, 50% 100%)"}} className="absolute z-10 top-[35%] left-[30%]" /><FaChessKing size={getSize()} color="black" className="absolute" style={{clipPath: "polygon(50% 0, 100% 0, 100% 100%, 50% 100%)"}}/></button>
                            <button className={`${!selectRandomPieceColour && pieceColour==0 ? " border-white shadow-lg shadow-white" : "border-gray-400"} p-1 md:p-2 border-4 bg-gray-300 rounded-lg hover:scale-105`} onClick={()=>handleSelectPieceColour(0)}><FaChessKing size={getSize()} color="black"/></button>
                        </div>
                    <div className="flex flex-col justify-center">
                        <div>
                            <div className="flex flex-col md:flex-row justify-center items-center -mt-5">
                                <div className={`flex justify-center text-xl font-bold font-anticDidone ${timeType===0 ? "bg-white hover:bg-gray-200 border-gray-600 shadow-lg shadow-white" : "bg-gray-400 hover:bg-gray-600 border-white"} transition-all duration-150 ease-in-out border-4 w-70 md:w-100 px-12 md:px-20 py-1 md:py-2 rounded-lg gap-1 md:gap-1.5`} onClick={()=>setTimeType(0)}>
                                    <div className="flex justify-center items-center">{preTime.t==="inf" ? <FaPeopleArrows size={getSizeYes()}/> : typeof(preTime.t)==="number" && preTime.t<=2 ? <GiBulletBill color="orange" size={26}/> : typeof(preTime.t)==="number" && preTime.t<=5 ? <AiFillThunderbolt color="gold" size={26}/> : <LuAlarmClock color="green" size={26}/>}</div>
                                    <div className={`flex justify-center text-base md:text-lg mt-0.5 md:mt-0 w-20 -ml-1 md:ml-1 ${timeType!==0 ? "text-gray-800" : "text-black"}`}>{preTime.t==="inf" ? <div className="flex justify-center items-center text-xs md:text-sm">PASS N PLAY</div> : preTime.i===0 ? `${preTime.t} min` : `${preTime.t} | ${preTime.i}`}</div>
                                    <button className="relative hover:scale-105 ml-2 -mr-8 md:ml-6 md:-mr-12" onClick={()=>handleDropdown()}>{!isDropdown ? <IoMdArrowDropdownCircle size={28} color={`${timeType===0 ? "#4b5563" : "white"}`}/> : <IoMdArrowDropupCircle size={28} color={`${timeType===0 ? "#4b5563" : "white"}`}/>}</button>
                                    {isDropdown && 
                                        <div className="absolute mt-10 justify-center bg-white border-4 px-4 py-1 rounded-lg border-gray-600">
                                            <div className="flex flex-col mt-2">
                                                <div className="flex gap-1">
                                                    <GiBulletBill color="orange"/>
                                                    <div className="text-sm md:text-base">BULLET</div>
                                                </div>
                                                <div className="flex gap-1.5 mt-1">
                                                    <button className="flex justify-center text-xs md:text-sm font-bold text-black bg-gray-400 hover:bg-gray-600 transition-all duration-150 ease-in-out border-2 w-14 md:w-20 py-2 rounded-lg border-gray-800 gap-1" onClick={()=>handleSetTime(1,0)}>1 min</button>
                                                    <button className="flex justify-center text-xs md:text-sm font-bold text-black bg-gray-400 hover:bg-gray-600 transition-all duration-150 ease-in-out border-2 w-14 md:w-20 py-2 rounded-lg border-gray-800 gap-1" onClick={()=>handleSetTime(1,1)}> 1 | 1</button>
                                                    <button className="flex justify-center text-xs md:text-sm font-bold text-black bg-gray-400 hover:bg-gray-600 transition-all duration-150 ease-in-out border-2 w-14 md:w-20 py-2 rounded-lg border-gray-800 gap-1" onClick={()=>handleSetTime(2,1)}> 2 | 1</button>
                                                </div>
                                            </div>
                                            <div className="flex flex-col mt-2">
                                                <div className="flex gap-1">
                                                    <AiFillThunderbolt color="gold"/>
                                                    <div className="text-sm md:text-base">BLITZ</div>
                                                </div>
                                                <div className="flex gap-1.5 mt-1">
                                                    <button className="flex justify-center text-xs md:text-sm font-bold text-black bg-gray-400 hover:bg-gray-600 transition-all duration-150 ease-in-out border-2 w-14 md:w-20 py-2 rounded-lg border-gray-800 gap-1" onClick={()=>handleSetTime(3,0)}>3 min</button>
                                                    <button className="flex justify-center text-xs md:text-sm font-bold text-black bg-gray-400 hover:bg-gray-600 transition-all duration-150 ease-in-out border-2 w-14 md:w-20 py-2 rounded-lg border-gray-800 gap-1" onClick={()=>handleSetTime(3,2)}>3 | 2</button>
                                                    <button className="flex justify-center text-xs md:text-sm font-bold text-black bg-gray-400 hover:bg-gray-600 transition-all duration-150 ease-in-out border-2 w-14 md:w-20 py-2 rounded-lg border-gray-800 gap-1" onClick={()=>handleSetTime(5,0)}>5 min</button>
                                                </div>
                                            </div>
                                            <div className="flex flex-col mt-2 mb-2">
                                                <div className="flex gap-1">
                                                    <LuAlarmClock color="green"/>
                                                    <div className="text-sm md:text-base">RAPID</div>
                                                </div>
                                                <div className="flex gap-1.5 mt-1">
                                                    <button className="flex justify-center text-xs md:text-sm font-bold text-black bg-gray-400 hover:bg-gray-600 transition-all duration-150 ease-in-out border-2 w-14 md:w-20 py-2 rounded-lg border-gray-800 gap-1" onClick={()=>handleSetTime(10,0)}>10 min</button>
                                                    <button className="flex justify-center text-xs md:text-sm font-bold text-black bg-gray-400 hover:bg-gray-600 transition-all duration-150 ease-in-out border-2 w-14 md:w-20 py-2 rounded-lg border-gray-800 gap-1" onClick={()=>handleSetTime(15,10)}>15 | 10</button>
                                                    <button className="flex justify-center text-xs md:text-sm font-bold text-black bg-gray-400 hover:bg-gray-600 transition-all duration-150 ease-in-out border-2 w-14 md:w-20 py-2 rounded-lg border-gray-800 gap-1" onClick={()=>handleSetTime(30,0)}>30 min</button>
                                                </div>
                                            </div>
                                            <div className="flex justify-center mb-1">
                                                <button className="text-xs md:text-sm font-bold text-black bg-gray-400 hover:bg-gray-600 border-2 px-4 py-1 rounded-lg transition-all duration-150 ease-in-out border-gray-800" onClick={()=>handleSetTime("inf",0)}><div className="flex justify-center items-center gap-2">PASS N PLAY<div><FaPeopleArrows color="white" size={20}/></div></div></button>
                                            </div>
                                        </div>
                                    }
                                </div>
                                <div className="flex justify-center w-[90%] my-3 md:my-0 md:h-14 md:w-0 border-2 border-gray-800 rounded-2xl mx-4"></div>
                                <div className={`flex justify-between border-4 px-6 md:px-10 rounded-lg ${timeType===1 ? "bg-white hover:bg-gray-200 border-gray-600 shadow-lg shadow-white" : "bg-gray-400 hover:bg-gray-600 border-white"}`} onClick={()=>setTimeType(1)}>
                                    <div className="flex justify-center items-center -my-2">
                                        <div className={`mt-1 text-base font-anticDidone font-black ${timeType===0 ? "text-gray-800" : "text-black"}`}>
                                            CUSTOM
                                        </div>
                                        <RiArrowDropRightLine color={`${timeType===1 ? "black" : "#1f2937"}`} size={30} className="-ml-1"/>
                                        <div className="flex gap-4 font-anticDidone font-bold text-black text-xl">
                                            <div className="flex flex-col justify-center items-center">
                                                <button onClick={() => {setCustTime((prev) => {if(prev.t<90){return { ...prev,t:prev.t+1}}return prev})}}><RiArrowDropUpLine size={40} color={`${timeType===1 ? "black" : "#1f2937"}`} className="-mb-2"/></button>
                                                <div className="flex justify-center items-center bg-gray-400 h-8 w-8 md:h-10 md:w-10 rounded-md">{custTime.t}</div>
                                                <button onClick={() => {setCustTime((prev) => {if(prev.t>0){return {...prev,t:prev.t-1}}return prev})}}><RiArrowDropDownLine size={40} color={`${timeType===1 ? "black" : "#1f2937"}`} className="-mt-2"/></button>
                                            </div>
                                            <div className="flex justify-center items-center mt-6 h-14 border-2 border-gray-800 rounded-2xl mx-2"></div>
                                            <div className="flex flex-col justify-center items-center">
                                                <button onClick={() => {setCustTime((prev) => {if(prev.i<30){return { ...prev,i:prev.i+1}}return prev})}}><RiArrowDropUpLine size={40} color={`${timeType===1 ? "black" : "#1f2937"}`} className="-mb-2"/></button>
                                                <div className="flex justify-center items-center bg-gray-400 h-8 w-8 md:h-10 md:w-10 rounded-md">{custTime.i}</div>
                                                <button onClick={() => {setCustTime((prev) => {if(prev.i>0){return {...prev,i:prev.i-1}}return prev})}}><RiArrowDropDownLine size={40} color={`${timeType===1 ? "black" : "#1f2937"}`} className="-mt-2"/></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-center mt-2 md:mt-4">
                                <button className="text-lg md:text-xl font-bold text-gray-600 font-anticDidone bg-white border-4 px-5 py-1 md:py-2 rounded-lg hover:bg-gray-200 transition-all duration-150 ease-in-out border-gray-600 shadow-lg shadow-white" onClick={()=>handleStartGame()}>START GAME</button>
                            </div>
                            <div className="flex justify-center items-center"><div className="w-[60%] md:w-[40%] my-3 border-2 border-gray-800 rounded-2xl"></div></div>
                            <div className="flex flex-col md:flex-row justify-center items-center gap-2">
                                <div className="flex justify-center">
                                    <button className="text-base md:text-lg font-bold text-gray-600 font-anticDidone bg-white border-4 px-4 py-1 md:py-2 rounded-lg hover:bg-gray-200 transition-all duration-150 ease-in-out border-gray-600 shadow-lg shadow-white" onClick={()=>setPlayOnlinePopup(true)}>PLAY ONLINE</button>
                                </div>
                                <div className="flex justify-center">
                                    <button className="text-base md:text-lg font-bold text-gray-600 font-anticDidone bg-white border-4 px-4 py-1 md:py-2 rounded-lg hover:bg-gray-200 transition-all duration-150 ease-in-out border-gray-600" onClick={()=>setIsBotDialogOpen(true)}><div className="flex justify-center items-center gap-2">Vs BOT<BsRobot size={getSizeArrow()}/></div></button>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-center gap-2">
                            <div className="flex justify-center mt-2 md:mt-4">
                                <button className="text-sm md:text-base font-bold text-gray-600 font-anticDidone bg-white border-4 px-3 py-1 rounded-lg hover:bg-gray-200 transition-all duration-150 ease-in-out border-gray-600 shadow-lg shadow-white" onClick={()=>setChooseTheme(true)}>CHANGE THEME</button>
                            </div>
                            <div className="flex justify-center mt-2 md:mt-4">
                                <button className="text-sm md:text-base font-bold text-gray-600 font-anticDidone bg-white border-4 px-8 py-1 rounded-lg hover:bg-gray-200 transition-all duration-150 ease-in-out border-gray-600 shadow-lg shadow-white" onClick={()=>router.push("/AnalysisPage")}>ANALYSIS</button>
                            </div>
                        </div>
                    </div>
                    {chooseTheme &&
                        <div className="absolute flex flex-col bg-white filter brightness-110 border-4 p-2 md:p-3 lg:p-4 border-black rounded-md w-[90%] h-[80%] md:w-[60%] md:h-[90%] lg:w-[50%] lg:h-full animate-expand">
                            <div className="flex flex-col items-end mb-4 lg:mb-10"><button onClick={()=>setChooseTheme(false)}><FaWindowClose color="#4b5563" size={iconSize}/></button></div>
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
                                {themeArray.map((item,index)=>(
                                    <div key={index} className="flex border-2 border-black rounded-lg" onClick={()=>setTheme(index)}>
                                        <div className="w-5 h-5 md:w-8 md:h-8 lg:w-10 lg:h-10" style={{background:themeArray[index].l}}></div>
                                        <div className="w-5 h-5 md:w-8 md:h-8 lg:w-10 lg:h-10" style={{background:themeArray[index].d}}></div>
                                        <div className="w-5 h-5 md:w-8 md:h-8 lg:w-10 lg:h-10" style={{background:themeArray[index].s}}></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    }
                    {playOnlinePopup && 
                        <div className="absolute z-20 h-[35%] w-[90%] md:h-[45%] md:w-[55%] lg:h-[55%] lg:w-[55%] flex flex-col bg-white rounded-md border-black border-4 animate-expand">
                            <div className="flex flex-col items-end mt-2 mr-2 md:mt-3 md:mr-3 lg:mt-4 lg:mr-4"><button onClick={()=>setPlayOnlinePopup(false)}><FaWindowClose color="#3b82f6" size={iconSize}/></button></div>
                            <div className="flex justify-center items-center mt-10 md:mt-14">
                                <input 
                                    id="userIdInput" 
                                    type="text" 
                                    placeholder="Enter player user-id" 
                                    onChange={(e)=>setSendRequestUserId(e.target.value)}
                                    className="w-[90%] md:w-[80%] p-2 border border-black rounded-lg text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                />
                            </div>
                            <div className="flex flex-col gap-4 lg:gap-6 justify-center items-center mt-4 lg:mt-6">
                            <button className="text-sm md:text-base font-bold text-gray-600 font-anticDidone bg-white border-4 px-8 py-1 rounded-lg hover:bg-gray-400 transition-all duration-150 ease-in-out border-gray-600 shadow-lg shadow-white" onClick={()=>handleSendRequest()}>SEND REQUEST</button>
                            </div>
                        </div>
                    }
                    {isBotDialogOpen &&
                        <div className="absolute flex flex-col bg-white filter brightness-110 border-4 p-2 md:p-2 lg:p-3 b-4 border-black rounded-md w-[90%] h-[80%] md:w-[60%] md:h-[85%] lg:w-[50%] lg:h-[105%] z-20 animate-expand">
                            <div className="flex flex-col items-end"><button onClick={()=>setIsBotDialogOpen(false)}><FaWindowClose color="#3b82f6" size={iconSize}/></button></div>
                            <div className="flex justify-center items-center gap-2 mb-2 md:mb-4"><BsRobot size={getSizeArrow()} color="#4b5563" /><div className="text-lg md:text-xl lg:text-2xl font-anticDidone font-bold">PLAY BOTS</div></div>
                            <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-5 gap-2 md:gap-3 mb-4">
                                {depthEloArr.map((item,index)=>(
                                    <div key={`${index}`} onClick={()=>setSelectedBot(index)} className={`border-2 md:border-4 ${selectedBot===index ? "border-gray-900 shadow-md shadow-gray-700" : "border-gray-400"} hover:scale-105 rounded-md cursor-pointer`}>
                                        <div>
                                            <Image src={`/images/lvl${index+1}.jpg`} alt="bg-lvl-images" height={getSizeBotImage()} width={getSizeBotImage()}></Image>
                                            <div className="flex justify-center items-center font-black font-anticDidone text-xs sm:text-sm md:text-base lg:text-lg">{item.elo}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-center items-center">
                                <button className="text-sm md:text-base font-bold text-gray-600 font-anticDidone bg-white border-4 px-8 py-1 rounded-lg hover:bg-gray-400 transition-all duration-150 ease-in-out border-gray-600 shadow-lg shadow-white" onClick={()=>router.push(`/GamePage?pieceColour=${pieceColour}&time=inf&increment=inf&depth=${depthEloArr[selectedBot].depth}`)}>START GAME</button>
                            </div>
                        </div>
                    }
                </div>
            </div>
            }
        </div>
    )
}

export default HomePage