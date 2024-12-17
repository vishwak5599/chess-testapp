"use client"
import { themeAtom } from "@/app/Atoms/ThemeAtom"
import ChessPiece from "@/app/Components/ChessPiece"
import useWindowSize from "@/app/Components/UseWindowSize"
import { useAtom } from "jotai"
import { useParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { IoCaretBackOutline, IoCaretForwardOutline, IoPause, IoPlay } from "react-icons/io5"
import { MdOutlineSkipNext, MdOutlineSkipPrevious } from "react-icons/md"
import { IoMdArrowRoundBack } from "react-icons/io"
import { useRouter } from "next/navigation"

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

const GameDetails = () => {
    const {gameId} = useParams()
    //atoms
    const [theme, setTheme] = useAtom(themeAtom)
    
    //hooks
    const windowSize = useWindowSize()
    const router = useRouter()

    //refs
    //set up ref for audios
    const audioRefCastle = useRef<HTMLAudioElement>(null)
    const audioRefCapture = useRef<HTMLAudioElement>(null)
    const audioRefMove = useRef<HTMLAudioElement>(null)
    const audioRefGameOverCheckMate = useRef<HTMLAudioElement>(null)

    const [boardData, setBoardData] = useState<moveType[]>()
    const [lastBoard, setLastBoard] = useState<string[][]>([])
    const [pieceColour, setPieceColour] = useState(1)
    const [moveNumber, setMoveNumber] = useState<number>(0)
    const [board, setBoard] = useState<string[][]>([
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ']
      ])
    const [isMovesPlaying, setIsMovesPlaying] = useState(false)

    const getSize = () =>{
        return windowSize<680 ? 30 : windowSize<768 ? 32 : windowSize<1024 ? 34 : windowSize<1128 ? 36 : windowSize<1440 ? 38 : windowSize<1800 ? 40 : 40
    }

    const getSizeArrow = () =>{
        return windowSize<680 ? 22 : windowSize<768 ? 24 : windowSize<1024 ? 26 : windowSize<1128 ? 28 : windowSize<1440 ? 30 : windowSize<1800 ? 30 : 32
    }

    useEffect(()=>{
        if (typeof window !== 'undefined') {
            if(typeof(gameId)==="string"){
                const itemValue = localStorage.getItem(gameId)
                if(itemValue){
                    try{
                        if(itemValue.startsWith("{")){
                            const parsedItem = JSON.parse(itemValue)
                            if(parsedItem.allGames!==null && parsedItem.lastBoard){
                                setBoardData(parsedItem.allMoves)
                                setPieceColour(parsedItem.pieceColour)
                                setLastBoard(parsedItem.lastBoard)
                                setBoard(
                                    parsedItem.pieceColour === 1
                                        ? [
                                            ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
                                            ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
                                            [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
                                            [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
                                            [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
                                            [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
                                            ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
                                            ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'],
                                        ]
                                        : [
                                            ['R', 'N', 'B', 'K', 'Q', 'B', 'N', 'R'],
                                            ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
                                            [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
                                            [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
                                            [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
                                            [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
                                            ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
                                            ['r', 'n', 'b', 'k', 'q', 'b', 'n', 'r'],
                                        ]
                                    )
                            }
                        }
                    } catch(error){
                        console.error(`Error parsing item with key ${gameId}:`, error)
                    }
                }
            }
        }
    },[gameId])

    const forwardMove = () => {
        if(boardData && moveNumber<boardData.length){
            //enpassant move
            if(boardData[moveNumber].enpass){
                setBoard((prevBoard)=>{
                    const newBoard = [...prevBoard]
                    newBoard[boardData[moveNumber].fromRow] = [...prevBoard[boardData[moveNumber].fromRow]]
                    newBoard[boardData[moveNumber].toRow] = [...prevBoard[boardData[moveNumber].toRow]]
                    newBoard[boardData[moveNumber].fromRow][boardData[moveNumber].fromCol] = " "
                    newBoard[boardData[moveNumber-1].toRow][boardData[moveNumber-1].toCol] = " "
                    newBoard[boardData[moveNumber].toRow][boardData[moveNumber].toCol] = boardData[moveNumber].piece
                    return newBoard
                })
                if(board[boardData[moveNumber].toRow][boardData[moveNumber].toCol]===" "){
                    if(audioRefMove.current){
                        audioRefMove.current.volume=1
                        audioRefMove.current.play()
                    }
                }
                else{
                    if(audioRefCapture.current){
                        audioRefCapture.current.volume=1
                        audioRefCapture.current.play()
                    }
                }
            }
            //pawn to last square
            else if(boardData[moveNumber].lastSquareUpdatedPiece){
                setBoard((prevBoard)=>{
                    const newBoard = [...prevBoard]
                    newBoard[boardData[moveNumber].fromRow] = [...prevBoard[boardData[moveNumber].fromRow]]
                    newBoard[boardData[moveNumber].toRow] = [...prevBoard[boardData[moveNumber].toRow]]
                    newBoard[boardData[moveNumber].fromRow][boardData[moveNumber].fromCol] = " "
                    if(boardData[moveNumber].lastSquareUpdatedPiece) newBoard[boardData[moveNumber].toRow][boardData[moveNumber].toCol] = boardData[moveNumber].lastSquareUpdatedPiece
                    return newBoard
                })
                if(board[boardData[moveNumber].toRow][boardData[moveNumber].toCol]===" "){
                    if(audioRefMove.current){
                        audioRefMove.current.volume=1
                        audioRefMove.current.play()
                    }
                }
                else{
                    if(audioRefCapture.current){
                        audioRefCapture.current.volume=1
                        audioRefCapture.current.play()
                    }
                }
            }
            //castling move
            else if((boardData[moveNumber].piece==="K" || boardData[moveNumber].piece==="k") && Math.abs(boardData[moveNumber].fromCol-boardData[moveNumber].toCol)===2){
                setBoard((prevBoard)=>{
                    const newBoard = [...prevBoard]
                    newBoard[boardData[moveNumber].fromRow] = [...prevBoard[boardData[moveNumber].fromRow]]
                    newBoard[boardData[moveNumber].toRow] = [...prevBoard[boardData[moveNumber].toRow]]
                    newBoard[boardData[moveNumber].fromRow][boardData[moveNumber].fromCol] = " "
                    newBoard[boardData[moveNumber].toRow][boardData[moveNumber].toCol] = boardData[moveNumber].piece
                    return newBoard
                })
                if(boardData[moveNumber].toRow===7 && boardData[moveNumber].toCol===2){
                    setBoard((prevBoard)=>{
                        const newBoard = [...prevBoard]
                        newBoard[7] = [...prevBoard[7]]
                        newBoard[7][0] = " "
                        newBoard[7][3] = pieceColour===1 ? "R" : "r"
                        return newBoard
                    })
                }
                else if(boardData[moveNumber].toRow===7 && boardData[moveNumber].toCol===6){
                    setBoard((prevBoard)=>{
                        const newBoard = [...prevBoard]
                        newBoard[7] = [...prevBoard[7]]
                        newBoard[7][7] = " "
                        newBoard[7][5] = pieceColour===1 ? "R" : "r"
                        return newBoard
                    })
                }
                else if(boardData[moveNumber].toRow===0 && boardData[moveNumber].toCol===2){
                    setBoard((prevBoard)=>{
                        const newBoard = [...prevBoard]
                        newBoard[0] = [...prevBoard[0]]
                        newBoard[0][0] = " "
                        newBoard[0][3] = pieceColour===1 ? "r" : "R"
                        return newBoard
                    })
                }
                else if(boardData[moveNumber].toRow===0 && boardData[moveNumber].toCol===6){
                    setBoard((prevBoard)=>{
                        const newBoard = [...prevBoard]
                        newBoard[0] = [...prevBoard[0]]
                        newBoard[0][0] = " "
                        newBoard[0][5] = pieceColour===1 ? "r" : "R"
                        return newBoard
                    })
                }
                if(audioRefCastle.current){
                    audioRefCastle.current.volume=1
                    audioRefCastle.current.play()
                }
            }
            //normal move
            else{
                setBoard((prevBoard)=>{
                    const newBoard = [...prevBoard]
                    newBoard[boardData[moveNumber].fromRow] = [...prevBoard[boardData[moveNumber].fromRow]]
                    newBoard[boardData[moveNumber].toRow] = [...prevBoard[boardData[moveNumber].toRow]]
                    newBoard[boardData[moveNumber].fromRow][boardData[moveNumber].fromCol] = " "
                    newBoard[boardData[moveNumber].toRow][boardData[moveNumber].toCol] = boardData[moveNumber].piece
                    return newBoard
                })
                if(board[boardData[moveNumber].toRow][boardData[moveNumber].toCol]===" "){
                    if(audioRefMove.current){
                        audioRefMove.current.volume=1
                        audioRefMove.current.play()
                    }
                }
                else{
                    if(audioRefCapture.current){
                        audioRefCapture.current.volume=1
                        audioRefCapture.current.play()
                    }
                }
            }
            if(moveNumber===boardData.length-1){
                if(audioRefGameOverCheckMate.current){
                    audioRefGameOverCheckMate.current.volume=1
                    audioRefGameOverCheckMate.current.play()
                }
            }
            setMoveNumber((prev)=>prev+1)
        }
    }

    const previousMove = () =>{
        if(boardData && moveNumber>0){
            //enpassant move
            if(boardData[moveNumber-1].enpass){
                setBoard((prevBoard)=>{
                    const newBoard = [...prevBoard]
                    newBoard[boardData[moveNumber-1].fromRow] = [...prevBoard[boardData[moveNumber-1].fromRow]]
                    newBoard[boardData[moveNumber-1].toRow] = [...prevBoard[boardData[moveNumber-1].toRow]]
                    newBoard[boardData[moveNumber-1].toRow][boardData[moveNumber-1].toCol] = " "
                    newBoard[boardData[moveNumber-1].fromRow][boardData[moveNumber-1].fromCol] = boardData[moveNumber-1].piece
                    newBoard[boardData[moveNumber-2].toRow][boardData[moveNumber-2].toCol] = boardData[moveNumber-2].piece
                    return newBoard
                })
                if(audioRefMove.current){
                    audioRefMove.current.volume=1
                    audioRefMove.current.play()
                }
            }
            //pawn to last square move
            else if(boardData[moveNumber-1].lastSquareUpdatedPiece && boardData[moveNumber-1].lastSquarePreviousPiece){
                setBoard((prevBoard)=>{
                    const newBoard = [...prevBoard]
                    newBoard[boardData[moveNumber-1].fromRow] = [...prevBoard[boardData[moveNumber-1].fromRow]]
                    newBoard[boardData[moveNumber-1].toRow] = [...prevBoard[boardData[moveNumber-1].toRow]]
                    newBoard[boardData[moveNumber-1].toRow][boardData[moveNumber-1].toCol] = boardData[moveNumber-1].lastSquarePreviousPiece || " "
                    newBoard[boardData[moveNumber-1].fromRow][boardData[moveNumber-1].fromCol] = boardData[moveNumber-1].piece
                    return newBoard
                })
                if(audioRefMove.current){
                    audioRefMove.current.volume=1
                    audioRefMove.current.play()
                }
            }
            //castling move
            else if((boardData[moveNumber-1].piece==="K" || boardData[moveNumber-1].piece==="k") && Math.abs(boardData[moveNumber-1].fromCol-boardData[moveNumber-1].toCol)===2){
                setBoard((prevBoard)=>{
                    const newBoard = [...prevBoard]
                    newBoard[boardData[moveNumber-1].fromRow] = [...prevBoard[boardData[moveNumber-1].fromRow]]
                    newBoard[boardData[moveNumber-1].toRow] = [...prevBoard[boardData[moveNumber-1].toRow]]
                    newBoard[boardData[moveNumber-1].toRow][boardData[moveNumber-1].toCol] = " "
                    newBoard[boardData[moveNumber-1].fromRow][boardData[moveNumber-1].fromCol] = boardData[moveNumber-1].piece
                    return newBoard
                })
                if(boardData[moveNumber-1].toRow===7 && boardData[moveNumber-1].toCol===2){
                    setBoard((prevBoard)=>{
                        const newBoard = [...prevBoard]
                        newBoard[7] = [...prevBoard[7]]
                        newBoard[7][3] = " "
                        newBoard[7][0] = pieceColour===1 ? "R" : "r"
                        return newBoard
                    })
                }
                else if(boardData[moveNumber-1].toRow===7 && boardData[moveNumber-1].toCol===6){
                    setBoard((prevBoard)=>{
                        const newBoard = [...prevBoard]
                        newBoard[7] = [...prevBoard[7]]
                        newBoard[7][5] = " "
                        newBoard[7][7] = pieceColour===1 ? "R" : "r"
                        return newBoard
                    })
                }
                else if(boardData[moveNumber-1].toRow===0 && boardData[moveNumber-1].toCol===2){
                    setBoard((prevBoard)=>{
                        const newBoard = [...prevBoard]
                        newBoard[0] = [...prevBoard[0]]
                        newBoard[0][3] = " "
                        newBoard[0][0] = pieceColour===1 ? "r" : "R"
                        return newBoard
                    })
                }
                else if(boardData[moveNumber-1].toRow===0 && boardData[moveNumber-1].toCol===6){
                    setBoard((prevBoard)=>{
                        const newBoard = [...prevBoard]
                        newBoard[0] = [...prevBoard[0]]
                        newBoard[0][5] = " "
                        newBoard[0][0] = pieceColour===1 ? "r" : "R"
                        return newBoard
                    })
                }
                if (audioRefCastle.current) {
                    audioRefCastle.current.volume=1
                    audioRefCastle.current.play()
                }
            }
            //normal move
            else{
                setBoard((prevBoard)=>{
                    const newBoard = [...prevBoard]
                    newBoard[boardData[moveNumber-1].fromRow] = [...prevBoard[boardData[moveNumber-1].fromRow]]
                    newBoard[boardData[moveNumber-1].toRow] = [...prevBoard[boardData[moveNumber-1].toRow]]
                    newBoard[boardData[moveNumber-1].toRow][boardData[moveNumber-1].toCol] = " "
                    newBoard[boardData[moveNumber-1].fromRow][boardData[moveNumber-1].fromCol] = boardData[moveNumber-1].piece
                    return newBoard
                })
                if(audioRefMove.current){
                    audioRefMove.current.volume=1
                    audioRefMove.current.play()
                }
            }
            setMoveNumber((prev)=>prev-1)
        }
    }

    //set board to starting position
    const handleStartingBoard = () => {
        setBoard(
            pieceColour === 1
                ? [
                    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
                    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
                    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
                    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
                    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
                    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
                    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
                    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'],
                ]
                : [
                    ['R', 'N', 'B', 'K', 'Q', 'B', 'N', 'R'],
                    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
                    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
                    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
                    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
                    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
                    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
                    ['r', 'n', 'b', 'k', 'q', 'b', 'n', 'r'],
                ]
            )
        setMoveNumber(0)
    }

    //setBoard to ending position
    const handleLastBoard = () => {
        setBoard(lastBoard)
        if(boardData) setMoveNumber(boardData.length)
    }

    useEffect(()=>{
        if(isMovesPlaying && boardData && moveNumber<boardData.length){
            const timeRef = setInterval(()=>{
                forwardMove()
            },1000)
            return ()=>clearInterval(timeRef)
        }
        else if(boardData && moveNumber===boardData.length) setIsMovesPlaying(false)
    },[isMovesPlaying,moveNumber])

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
        <div className="flex flex-col overflow-hidden h-screen w-screen">
            <audio ref={audioRefCastle} src="/sounds/castling.mp3" />
            <audio ref={audioRefCapture} src="/sounds/capture.mp3" />
            <audio ref={audioRefMove} src="/sounds/move.mp3" />
            <audio ref={audioRefGameOverCheckMate} src="/sounds/gameovercheckmate.mp3" />
            <button onClick={()=>router.push('/AnalysisPage')} className="flex items-center w-screen m-2 md:m-4"><IoMdArrowRoundBack size={getSizeArrow()}/></button>
            <div className="flex flex-col items-center">
                <div className="rounded-md" style={{border:`${windowSize >= 768 ? "12px" : "6px"} solid ${themeArray[theme].s}`}}>
                    {board.map((row,i)=>(
                        <div key={i} className="flex justify-center items-center">
                            {row.map((col,j)=>(
                                <div key={i+""+j} style={{background:(i+j)%2==0 ? themeArray[theme].l : themeArray[theme].d}}>
                                <div key={i+""+j} className="relative flex h-12 w-12 sm:h-9 sm:w-9 md:h-11 md:w-11 lg:h-12 lg:w-12 xl:h-14 xl:w-14 xxl:h-16 xxl:w-16 justify-center items-center" 
                                style={{
                                    backgroundColor:
                                    (moveNumber>0 && boardData && ((i===boardData[moveNumber-1].fromRow && j===boardData[moveNumber-1].fromCol) ||
                                    (i===boardData[moveNumber-1].toRow && j===boardData[moveNumber-1].toCol))) ?
                                    "#fcd34d" :
                                    (i + j) % 2 === 0
                                        ? themeArray[theme].l
                                        : themeArray[theme].d,
                                    border:"none",
                                    borderRadius: "0px",
                                    boxSizing: "border-box",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                }}
                                >
                                    {j===0 && (
                                        <div className="absolute top-0 left-0.5 lg:left-1 text-xxs lg:text-xs" style={{color:(i+j)%2===0 ? `${themeArray[theme].d}` : `${themeArray[theme].l}`}}>{pieceColour===1 ? 8 - i : i + 1}</div>
                                    )}
                                    <ChessPiece col={col} />
                                    {i===7 && (
                                        <div className="absolute bottom-0 right-0.5 lg:right-1 text-xxs lg:text-xs" style={{color:(i+j)%2===0 ? `${themeArray[theme].d}` : `${themeArray[theme].l}`}}>{pieceColour===1 ? String.fromCharCode(97 + j) : String.fromCharCode(104 - j)}</div>
                                    )}
                                </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
                <div className="flex gap-1 md:gap-2 mt-2">
                    <div><MdOutlineSkipPrevious size={getSize()} color={`${themeArray[theme].s}`} className="border-2 border-black rounded-md" onClick={()=>handleStartingBoard()} /></div>
                    <div><IoCaretBackOutline size={getSize()} color={`${themeArray[theme].s}`} className="border-2 border-black rounded-md" onClick={()=>previousMove()}/></div>
                    {isMovesPlaying ? <IoPause size={getSize()} color={`${themeArray[theme].s}`} className="border-2 border-black rounded-md" onClick={()=>setIsMovesPlaying(false)}/> : <IoPlay size={getSize()} color={`${themeArray[theme].s}`} className="border-2 border-black rounded-md" onClick={()=>setIsMovesPlaying(true)}/>}
                    <div><IoCaretForwardOutline size={getSize()} color={`${themeArray[theme].s}`} className="border-2 border-black rounded-md" onClick={()=>forwardMove()} /></div>
                    <div><MdOutlineSkipNext size={getSize()} color={`${themeArray[theme].s}`} className="border-2 border-black rounded-md" onClick={()=>handleLastBoard()} /></div>
                </div>
            </div>
        </div>
    )
}

export default GameDetails