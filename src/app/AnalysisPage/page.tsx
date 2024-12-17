"use client"
import { FaChessRook, FaChessKnight, FaChessBishop, FaChessQueen, FaChessKing, FaChessPawn } from "react-icons/fa"
import { IoMdArrowRoundBack } from "react-icons/io"
import useWindowSize from '../Components/UseWindowSize'
import { useAtom } from "jotai"
import { themeAtom } from "../Atoms/ThemeAtom"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
type moveType = {
    piece : string
    fromRow : number
    fromCol : number
    toRow : number
    toCol : number
    enpass? : boolean
    lastSquareUpdatedPiece?: string
    lastSquarePreviousPiece?: string
}

const AnalysisPage = () => {

    //atoms
    const [theme, setTheme] = useAtom(themeAtom)
    
    //hooks
    const windowSize = useWindowSize()
    const router = useRouter()

    const [boardData, setBoardData] = useState<{gameId:string,allMoves:moveType[],lastBoard:string[][],pieceColour:number,result:string}[]>([])

    const getSize = () =>{
        return windowSize<680 ? 12 : windowSize<768 ? 14 : windowSize<1024 ? 16 : windowSize<1128 ? 20 : windowSize<1440 ? 22 : windowSize<1800 ? 24 : 24
    }

    const getSizeArrow = () =>{
        return windowSize<680 ? 22 : windowSize<768 ? 24 : windowSize<1024 ? 26 : windowSize<1128 ? 28 : windowSize<1440 ? 30 : windowSize<1800 ? 30 : 32
    }

    useEffect(()=>{
        let prevGames: { gameId:string, allMoves:moveType[], lastBoard:string[][], pieceColour:number, result:string }[] = []

        for (let i=0;i<localStorage.length;i++){
            if (typeof window !== 'undefined') {
                const itemKey = localStorage.key(i)
                if(itemKey){
                    const itemValue = localStorage.getItem(itemKey)
                    if(itemValue){
                        try{
                            if(itemValue.startsWith("{")){
                                const parsedItem = JSON.parse(itemValue)
                                if(parsedItem.allGames!==null && parsedItem.lastBoard){
                                    const gameId = itemKey
                                    prevGames.push({
                                    gameId,
                                    allMoves: parsedItem.allMoves,
                                    lastBoard: parsedItem.lastBoard,
                                    pieceColour: parsedItem.pieceColour,
                                    result: parsedItem.result,
                                })
                                }
                            }
                        } catch(error){
                            console.error(`Error parsing item with key ${itemKey}:`, error)
                        }
                    }
                }
            }
        setBoardData(prevGames)
    }
    },[])

    const themeArray = [
        { l: "#A3B18C", d: "#4A4A4A", s: "#1C1C1C"},   // My Choice
        { l: "#E1B6F4", d: "#8A2BE2", s: "#9C4A94" },  // Light Lavender and Deep Purple
        { l: "#E0C09F", d: "#7A5C47", s: "#A8D1E7" },  // Classic Wood Style
        { l: "#A9C8D8", d: "#2A3E59", s: "#6EC1E4" },  // Elegant Blue Theme
        { l: "#D1D1D1", d: "#4B4B4B", s: "#F8C470" },  // Classic Black and White
        { l: "#A1D3A1", d: "#4C6B2F", s: "#2A4D31" },  // Natural Green Theme
        { l: "#F5A7B8", d: "#E63946", s: "#FF6F61" },  // Soft Pink and Red with Coral
    ]

    return(
        <div className="flex flex-col mb-2 md:mb-4">
            <button onClick={()=>router.push('/HomePage')} className="flex items-center m-2 md:m-4"><IoMdArrowRoundBack size={getSizeArrow()}/></button>
            <div className="text-black font-extrabold text-xl md:text-3xl font-anticDidone flex justify-center mb-2 md:mb-4">ANALYSIS</div>
            <div className="flex flex-wrap justify-center items-center px-3 gap-3">
                {boardData && boardData.map((item,index)=>(
                    <div key={index} className="flex flex-col justify-center items-center w-[45%] md:w-[32%] rounded-md">
                        <div className={`absolute flex justify-center items-center text-lg md:text-xl font-bold ${item.result==="white" ? "text-white" : "text-black"}`}>{item.result==="white" ? "WHITE WON" : item.result==="black" ? "BLACK WON" : "DRAW"}</div>
                        <div className="border-2 md:border-4 border-black rounded-md cursor-pointer" onClick={()=>router.push(`/AnalysisPage/${item.gameId}`)}>
                            {item && item.lastBoard && item.lastBoard.map((row,rindex)=>(
                                <div key={rindex} className="flex w-full">
                                    {row.map((col,cindex)=>(
                                        <div key={cindex} className="flex h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 xl:h-8 xl:w-8 xxl:h-9 xxl:w-9 justify-center items-center" style={{background:(rindex+cindex)%2==0 ? themeArray[theme].l : themeArray[theme].d}}>
                                            {col=="R" ? <FaChessRook color="white" size={getSize()}/> :
                                            col=="r" ? <FaChessRook color="black" size={getSize()}/> :
                                            col=="N" ? <FaChessKnight color="white" size={getSize()}/> :
                                            col=="n" ? <FaChessKnight color="black" size={getSize()}/> :
                                            col=="B" ? <FaChessBishop color="white" size={getSize()}/> :
                                            col=="b" ? <FaChessBishop color="black" size={getSize()}/> :
                                            col=="Q" ? <FaChessQueen color="white" size={getSize()}/> :
                                            col=="q" ? <FaChessQueen color="black" size={getSize()}/> :
                                            col=="K" ? <FaChessKing color="white" size={getSize()}/> :
                                            col=="k" ? <FaChessKing color="black" size={getSize()}/> :
                                            col=="P" ? <FaChessPawn color="white" size={getSize()}/> :
                                            col=="p" ? <FaChessPawn color="black" size={getSize()}/> :
                                            col}
                                        </div>
                                    ))}
                                </div>
                            ))}
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    )
    
}

export default AnalysisPage