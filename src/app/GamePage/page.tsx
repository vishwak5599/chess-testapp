"use client"
import ChessPiece from "../Components/ChessPiece"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useRef, useState } from "react"
import { FaStopwatch } from "react-icons/fa6"
import { MdSkipPrevious } from "react-icons/md"
import { FaUser, FaWindowClose } from "react-icons/fa"
import useWindowSize from '../Components/UseWindowSize'
import { themeAtom } from "../Atoms/ThemeAtom"
import { useAtom } from "jotai"

import { usePrivy } from "@privy-io/react-auth"
import { io } from "socket.io-client"

type selectedPieceType = {
    piece : string | null
    row : number | null
    col : number | null
}

type possibleMovesForPieceType = {
    row : number
    col : number
}

type piecePositionType = {
    piece : string
    row : number
    col : number
}

type pawnToLastSquarePosiType = {
    piece : string | null
    selRow : number | null
    selCol : number | null
    newRow : number | null
    newCol : number | null
}

type allPossibleMovesType = {
    piece : string
    posi:{row:number,col:number}
    moves:{row:number,col:number}[]
    protected:{row:number,col:number}[]
}

type allTempPossibleMovesType = {
    piece : string
    posi:{row:number,col:number}
    moves:{row:number,col:number}[]
}

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

const HomePageContent=()=>{

    //atoms
    const [theme, setTheme] = useAtom(themeAtom)

    //hooks
    const windowSize = useWindowSize()
    const router = useRouter()
    const searchParams = useSearchParams()
    const {user, ready, authenticated} = usePrivy()

    const pieceColour = searchParams ? Number(searchParams.get('pieceColour')) : 1
    const time = searchParams ? searchParams.get('time')!=="inf" ? Number(searchParams.get('time'))*60 : null : 30*60
    const increment = searchParams ? searchParams.get('time')!=="inf" ? Number(searchParams.get('increment')) : null : 0
    const opponent = (searchParams && searchParams.get('oppoUid') && searchParams.get('oppoUname')) ? {oppoUid:searchParams.get('oppoUid'),oppoUname:searchParams.get('oppoUname')} : null

    //states
    const [moves,setMoves] = useState(0)
    const [isSelected, setIsSelected] = useState(false)
    const [selectedPiece, setSelectedPiece] = useState<selectedPieceType>({piece: null,row: null,col: null})
    const [possibleMovesForSelectedPiece, setPossibleMovesForSelectedPiece] = useState<possibleMovesForPieceType[]>([])
    const [allPossibleMovesForWhite, setAllPossibleMovesForWhite] = useState<allPossibleMovesType[]>([])
    const [allPossibleMovesForBlack, setAllPossibleMovesForBlack] = useState<allPossibleMovesType[]>([])
    const [curWhite,setCurWhite] = useState<piecePositionType[]>([])
    const [curBlack,setCurBlack] = useState<piecePositionType[]>([])
    const [pawnToLastSquarePosi, setPawnToLastSquarePosi] = useState<pawnToLastSquarePosiType>({piece:null,selRow:null,selCol:null,newRow:null,newCol:null})
    const [whiteKingCastlePossible,setWhiteKingCastlePossible] = useState(true)
    const [blackKingCastlePossible,setBlackKingCastlePossible] = useState(true)
    const [whiteRookCastlePossible,setWhiteRookCastlePossible] = useState({left:true,right:true})
    const [blackRookCastlePossible,setBlackRookCastlePossible] = useState({left:true,right:true})
    const [allMoves, setAllMoves] = useState<moveType[]>([])
    const [socket, setSocket] = useState<any>(undefined)

    //set game result
    const [whiteWon, setWhiteWon] = useState(false)
    const [blackWon, setBlackWon] = useState(false)
    const [staleMateWhiteWon, setStaleMateWhiteWon] = useState(false)
    const [staleMateBlackWon, setStaleMateBlackWon] = useState(false)
    const [draw, setDraw] = useState(false)
    const [pauseTheBoard, setPauseTheBoard] = useState(false)

    //set time for each player
    const [whitePlayerTime, setWhitePlayerTime] = useState(time)
    const [blackPlayerTime, setBlackPlayerTime] = useState(time)

    const [iconSize, setIconSize] = useState(20)

    //set up ref for audios
    const audioRefCastle = useRef<HTMLAudioElement>(null)
    const audioRefCapture = useRef<HTMLAudioElement>(null)
    const audioRefMove = useRef<HTMLAudioElement>(null)
    const audioRefCheck = useRef<HTMLAudioElement>(null)
    const audioRefGameOverCheckMate = useRef<HTMLAudioElement>(null)
    const audioRefGameOverStaleMate = useRef<HTMLAudioElement>(null)

    const [board,setBoard] = useState(pieceColour===1 ? [
        ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
        ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
        ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
    ] :
    [
        ['R', 'N', 'B', 'K', 'Q', 'B', 'N', 'R'],
        ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
        ['r', 'n', 'b', 'k', 'q', 'b', 'n', 'r']
    ]
    )
    const whitePieces = ["R","N","B","Q","K","P"]
    const blackPieces = ["r","n","b","q","k","p"]

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

    //decrease the timer for players for each move
    useEffect(() => {
        if(whitePlayerTime!==null && blackPlayerTime!==null && increment!==null){
            let intervalId:NodeJS.Timeout
            if (((pieceColour===1 && moves%2===0) || (pieceColour===0 && moves%2===0)) && !(draw || staleMateWhiteWon || staleMateBlackWon || whiteWon || blackWon)) {
                if(whitePlayerTime>0){
                    intervalId = setInterval(()=>{
                        setWhitePlayerTime((prev)=>prev!==null ? prev-1 : 0)
                    }, 1000)
                    //increment
                    if(moves>1) setBlackPlayerTime((prev)=>prev!==null ? prev+increment : 0);
                    
                }
            } else if(((pieceColour===1 && moves%2!==0) || (pieceColour===0 && moves%2!==0)) && !(draw || staleMateWhiteWon || staleMateBlackWon || whiteWon || blackWon)) {
                if(blackPlayerTime>0){
                    intervalId = setInterval(()=>{
                        setBlackPlayerTime((prev)=>prev!==null ? prev-1 : 0)
                    }, 1000)
                    //increment
                    if(moves>0) setWhitePlayerTime((prev)=>prev!==null ? prev+increment : 0);
                }
            }
        
            return ()=>clearInterval(intervalId)
        }
    }, [pieceColour,moves,draw,staleMateBlackWon,staleMateWhiteWon,whiteWon,blackWon])

    useEffect(()=>{
        if(whitePlayerTime!==null && blackPlayerTime!==null){
            if(whitePlayerTime===0 && blackPlayerTime>0){
                setBlackWon(true)
            }
            else if(blackPlayerTime===0 && whitePlayerTime>0){
                setWhiteWon(true)
            }
        }
    },[whitePlayerTime,blackPlayerTime])

    //ways of draw

    //if there is no pieces on board other than kings
    useEffect(()=>{
        let flag = false
        outerLoop : for(let i=0;i<board.length;i++){
            for(let j=0;j<board[0].length;j++){
                if(board[i][j]!==" " && board[i][j]!=="K" && board[i][j]!=="k"){
                    flag=true
                    break outerLoop
                }
            }
        }
        if(flag===false) setDraw(true)
    },[board])

    //if position is repeated three times
    useEffect(()=>{
        if(allMoves.length>9){
            if((allMoves[allMoves.length-9].toRow===allMoves[allMoves.length-5].toRow) && 
            (allMoves[allMoves.length-9].toCol===allMoves[allMoves.length-5].toCol) && 
            (allMoves[allMoves.length-5].toRow===allMoves[allMoves.length-1].toRow) &&
            (allMoves[allMoves.length-5].toCol===allMoves[allMoves.length-1].toCol) && 
            (allMoves[allMoves.length-8].toRow===allMoves[allMoves.length-4].toRow) &&
            (allMoves[allMoves.length-8].toCol===allMoves[allMoves.length-4].toCol) &&
            (allMoves[allMoves.length-6].toRow===allMoves[allMoves.length-2].toRow) &&
            (allMoves[allMoves.length-6].toCol===allMoves[allMoves.length-2].toCol) &&
            (allMoves[allMoves.length-7].toRow===allMoves[allMoves.length-3].toRow) &&
            (allMoves[allMoves.length-7].toCol===allMoves[allMoves.length-3].toCol)){
                setDraw(true)
            }
        }
    },[moves, allMoves])

    //add to local storage
    useEffect(()=>{
        if(draw || staleMateWhiteWon || staleMateBlackWon || whiteWon || blackWon){
            localStorage.setItem(`game-${localStorage.length-24}`, JSON.stringify({allMoves:allMoves,lastBoard:board,pieceColour:pieceColour,result:(whiteWon ? "white" : blackWon ? "black" : "draw")}));
        }
    },[draw,staleMateWhiteWon,staleMateBlackWon,whiteWon,blackWon])

    //need to create a button if player wants to draw or agrees a draw

    //**check if anyone won or there is any stalemate and make it a draw */
    useEffect(()=>{
        if(opponent){
            const ifWhiteKingInThreat = findThreatToWhiteKing(allPossibleMovesForBlack,board)
            if(ifWhiteKingInThreat){
                if (audioRefCheck.current) {
                    audioRefCheck.current.volume=1
                    audioRefCheck.current.play()
                }
                const whiteKingPiece = allPossibleMovesForWhite.find((piece) => piece.piece === "K")
                let flag = false
                if (whiteKingPiece && whiteKingPiece.moves.length === 0) {
                    outerLoop: for (const piece of allPossibleMovesForWhite) {
                        for (const move of piece.moves) {
                            let updatedBoard:string[][] = [...board]
                            updatedBoard[piece.posi.row] = [...board[piece.posi.row]]
                            updatedBoard[move.row] = [...board[move.row]]
                            updatedBoard[piece.posi.row][piece.posi.col] = " "
                            updatedBoard[move.row][move.col] = piece.piece
                            if((pieceColour===1 && piece.piece==="P" && piece.posi.row===3 && allMoves[allMoves.length-1].piece==="p" && move.row===2 && move.col===allMoves[allMoves.length-1].toCol && allMoves[allMoves.length-1].toRow===3) ||
                                (pieceColour===0 && piece.piece==="P" && piece.posi.row===4 && allMoves[allMoves.length-1].piece==="p" && move.row===5 && move.col===allMoves[allMoves.length-1].toCol && allMoves[allMoves.length-1].toRow===4))
                            {
                                updatedBoard[allMoves[allMoves.length-1].toRow][allMoves[allMoves.length-1].toCol] = " "
                            }
                            let arr:allTempPossibleMovesType[] = []
                            updatedBoard.map((r,rind)=>{
                                r.map((c,cind)=>{
                                    if(blackPieces.includes(c)){
                                        if(c==="p") arr.push(findMovesForp(rind,cind,false,updatedBoard))
                                        if(c==="n") arr.push(findMovesForn(rind,cind,false,updatedBoard))
                                        if(c==="r") arr.push(findMovesForr(rind,cind,false,updatedBoard))
                                        if(c==="b") arr.push(findMovesForb(rind,cind,false,updatedBoard))
                                        if(c==="q") arr.push(findMovesForq(rind,cind,false,updatedBoard))
                                    }
                                })
                            })
                            const afterMoveIfWhiteKingInThreat = findThreatToWhiteKing(arr,updatedBoard)
                            if(!afterMoveIfWhiteKingInThreat){
                                flag=true
                                break outerLoop
                            }
                        }
                    }
                    if(flag===false){
                        if (audioRefGameOverCheckMate.current) {
                            audioRefGameOverCheckMate.current.volume=1
                            audioRefGameOverCheckMate.current.play()
                        }
                        setBlackWon(true)
                    }
                }
            }
            else{
                const whiteKingPiece = allPossibleMovesForWhite.find((piece) => piece.piece === "K")
                let flag = false
                if (whiteKingPiece && whiteKingPiece.moves.length === 0) {
                    outerLoop: for (const piece of allPossibleMovesForWhite) {
                        if(piece.moves.length>0){
                            flag=true
                            break outerLoop
                        }
                    }
                    if(flag===false){
                        if (audioRefGameOverStaleMate.current) {
                            audioRefGameOverStaleMate.current.volume=1
                            audioRefGameOverStaleMate.current.play()
                        }
                        setStaleMateWhiteWon(true)
                    }
                }
            }
            const ifBlackKingInThreat = findThreatToBlackKing(allPossibleMovesForWhite,board)
            if(ifBlackKingInThreat){
                if (audioRefCheck.current) {
                    audioRefCheck.current.volume=1
                    audioRefCheck.current.play()
                }
                const blackKingPiece = allPossibleMovesForBlack.find((piece) => piece.piece === "k")
                let flag = false
                if (blackKingPiece && blackKingPiece.moves.length === 0) {
                    outerLoop: for (const piece of allPossibleMovesForBlack) {
                        for (const move of piece.moves) {
                            let updatedBoard:string[][] = [...board]
                            updatedBoard[piece.posi.row] = [...board[piece.posi.row]]
                            updatedBoard[move.row] = [...board[move.row]]
                            updatedBoard[piece.posi.row][piece.posi.col] = " "
                            updatedBoard[move.row][move.col] = piece.piece
                            if((pieceColour===1 && piece.piece==="p" && piece.posi.row===4 && allMoves[allMoves.length-1].piece==="P" && move.row===5 && move.col===allMoves[allMoves.length-1].toCol && allMoves[allMoves.length-1].toRow===4) ||
                                (pieceColour===0 && piece.piece==="p" && piece.posi.row===3 && allMoves[allMoves.length-1].piece==="P" && move.row===2 && move.col===allMoves[allMoves.length-1].toCol && allMoves[allMoves.length-1].toRow===3))
                            {
                                updatedBoard[allMoves[allMoves.length-1].toRow][allMoves[allMoves.length-1].toCol] = " "
                            }
                            let arr:allTempPossibleMovesType[] = []
                            updatedBoard.map((r,rind)=>{
                                r.map((c,cind)=>{
                                    if(whitePieces.includes(c)){
                                        if(c==="P") arr.push(findMovesForP(rind,cind,false,updatedBoard))
                                        if(c==="N") arr.push(findMovesForN(rind,cind,false,updatedBoard))
                                        if(c==="R") arr.push(findMovesForR(rind,cind,false,updatedBoard))
                                        if(c==="B") arr.push(findMovesForB(rind,cind,false,updatedBoard))
                                        if(c==="Q") arr.push(findMovesForQ(rind,cind,false,updatedBoard))
                                    }
                                })
                            })
                            const afterMoveIfBlackKingInThreat = findThreatToBlackKing(arr,updatedBoard)
                            if(!afterMoveIfBlackKingInThreat){
                                flag=true
                                break outerLoop
                            }
                        }
                    }
                    if(flag===false){
                        if (audioRefGameOverCheckMate.current) {
                            audioRefGameOverCheckMate.current.volume=1
                            audioRefGameOverCheckMate.current.play()
                        }
                        setWhiteWon(true)
                    }
                }
            }
            else{
                const blackKingPiece = allPossibleMovesForWhite.find((piece) => piece.piece === "k")
                let flag = false
                if (blackKingPiece && blackKingPiece.moves.length === 0) {
                    outerLoop: for (const piece of allPossibleMovesForBlack) {
                        if(piece.moves.length>0){
                            flag=true
                            break outerLoop
                        }
                    }
                    if(flag===false){
                        if (audioRefGameOverStaleMate.current) {
                            audioRefGameOverStaleMate.current.volume=1
                            audioRefGameOverStaleMate.current.play()
                        }
                        setStaleMateBlackWon(true)
                    }
                }
            }
        }
        else{
            if(moves%2===0){
                const ifWhiteKingInThreat = findThreatToWhiteKing(allPossibleMovesForBlack,board)
                if(ifWhiteKingInThreat){
                    if (audioRefCheck.current) {
                        audioRefCheck.current.volume=1
                        audioRefCheck.current.play()
                    }
                    const whiteKingPiece = allPossibleMovesForWhite.find((piece) => piece.piece === "K")
                    let flag = false
                    if (whiteKingPiece && whiteKingPiece.moves.length === 0) {
                        outerLoop: for (const piece of allPossibleMovesForWhite) {
                            for (const move of piece.moves) {
                                let updatedBoard:string[][] = [...board]
                                updatedBoard[piece.posi.row] = [...board[piece.posi.row]]
                                updatedBoard[move.row] = [...board[move.row]]
                                updatedBoard[piece.posi.row][piece.posi.col] = " "
                                updatedBoard[move.row][move.col] = piece.piece
                                if((pieceColour===1 && piece.piece==="P" && piece.posi.row===3 && allMoves[allMoves.length-1].piece==="p" && move.row===2 && move.col===allMoves[allMoves.length-1].toCol && allMoves[allMoves.length-1].toRow===3) ||
                                    (pieceColour===0 && piece.piece==="P" && piece.posi.row===4 && allMoves[allMoves.length-1].piece==="p" && move.row===5 && move.col===allMoves[allMoves.length-1].toCol && allMoves[allMoves.length-1].toRow===4))
                                {
                                    updatedBoard[allMoves[allMoves.length-1].toRow][allMoves[allMoves.length-1].toCol] = " "
                                }
                                let arr:allTempPossibleMovesType[] = []
                                updatedBoard.map((r,rind)=>{
                                    r.map((c,cind)=>{
                                        if(blackPieces.includes(c)){
                                            if(c==="p") arr.push(findMovesForp(rind,cind,false,updatedBoard))
                                            if(c==="n") arr.push(findMovesForn(rind,cind,false,updatedBoard))
                                            if(c==="r") arr.push(findMovesForr(rind,cind,false,updatedBoard))
                                            if(c==="b") arr.push(findMovesForb(rind,cind,false,updatedBoard))
                                            if(c==="q") arr.push(findMovesForq(rind,cind,false,updatedBoard))
                                        }
                                    })
                                })
                                const afterMoveIfWhiteKingInThreat = findThreatToWhiteKing(arr,updatedBoard)
                                if(!afterMoveIfWhiteKingInThreat){
                                    flag=true
                                    break outerLoop
                                }
                            }
                        }
                        if(flag===false){
                            if (audioRefGameOverCheckMate.current) {
                                audioRefGameOverCheckMate.current.volume=1
                                audioRefGameOverCheckMate.current.play()
                            }
                            setBlackWon(true)
                        }
                    }
                }
                else{
                    const whiteKingPiece = allPossibleMovesForWhite.find((piece) => piece.piece === "K")
                    let flag = false
                    if (whiteKingPiece && whiteKingPiece.moves.length === 0) {
                        outerLoop: for (const piece of allPossibleMovesForWhite) {
                            if(piece.moves.length>0){
                                flag=true
                                break outerLoop
                            }
                        }
                        if(flag===false){
                            if (audioRefGameOverStaleMate.current) {
                                audioRefGameOverStaleMate.current.volume=1
                                audioRefGameOverStaleMate.current.play()
                            }
                            setStaleMateWhiteWon(true)
                        }
                    }
                }
            }
            else{
                const ifBlackKingInThreat = findThreatToBlackKing(allPossibleMovesForWhite,board)
                if(ifBlackKingInThreat){
                    if (audioRefCheck.current) {
                        audioRefCheck.current.volume=1
                        audioRefCheck.current.play()
                    }
                    const blackKingPiece = allPossibleMovesForBlack.find((piece) => piece.piece === "k")
                    let flag = false
                    if (blackKingPiece && blackKingPiece.moves.length === 0) {
                        outerLoop: for (const piece of allPossibleMovesForBlack) {
                            for (const move of piece.moves) {
                                let updatedBoard:string[][] = [...board]
                                updatedBoard[piece.posi.row] = [...board[piece.posi.row]]
                                updatedBoard[move.row] = [...board[move.row]]
                                updatedBoard[piece.posi.row][piece.posi.col] = " "
                                updatedBoard[move.row][move.col] = piece.piece
                                if((pieceColour===1 && piece.piece==="p" && piece.posi.row===4 && allMoves[allMoves.length-1].piece==="P" && move.row===5 && move.col===allMoves[allMoves.length-1].toCol && allMoves[allMoves.length-1].toRow===4) ||
                                    (pieceColour===0 && piece.piece==="p" && piece.posi.row===3 && allMoves[allMoves.length-1].piece==="P" && move.row===2 && move.col===allMoves[allMoves.length-1].toCol && allMoves[allMoves.length-1].toRow===3))
                                {
                                    updatedBoard[allMoves[allMoves.length-1].toRow][allMoves[allMoves.length-1].toCol] = " "
                                }
                                let arr:allTempPossibleMovesType[] = []
                                updatedBoard.map((r,rind)=>{
                                    r.map((c,cind)=>{
                                        if(whitePieces.includes(c)){
                                            if(c==="P") arr.push(findMovesForP(rind,cind,false,updatedBoard))
                                            if(c==="N") arr.push(findMovesForN(rind,cind,false,updatedBoard))
                                            if(c==="R") arr.push(findMovesForR(rind,cind,false,updatedBoard))
                                            if(c==="B") arr.push(findMovesForB(rind,cind,false,updatedBoard))
                                            if(c==="Q") arr.push(findMovesForQ(rind,cind,false,updatedBoard))
                                        }
                                    })
                                })
                                const afterMoveIfBlackKingInThreat = findThreatToBlackKing(arr,updatedBoard)
                                if(!afterMoveIfBlackKingInThreat){
                                    flag=true
                                    break outerLoop
                                }
                            }
                        }
                        if(flag===false){
                            if (audioRefGameOverCheckMate.current) {
                                audioRefGameOverCheckMate.current.volume=1
                                audioRefGameOverCheckMate.current.play()
                            }
                            setWhiteWon(true)
                        }
                    }
                }
                else{
                    const blackKingPiece = allPossibleMovesForWhite.find((piece) => piece.piece === "k")
                    let flag = false
                    if (blackKingPiece && blackKingPiece.moves.length === 0) {
                        outerLoop: for (const piece of allPossibleMovesForBlack) {
                            if(piece.moves.length>0){
                                flag=true
                                break outerLoop
                            }
                        }
                        if(flag===false){
                            if (audioRefGameOverStaleMate.current) {
                                audioRefGameOverStaleMate.current.volume=1
                                audioRefGameOverStaleMate.current.play()
                            }
                            setStaleMateBlackWon(true)
                        }
                    }
                }
            }
        }
    },[moves,allPossibleMovesForBlack,allPossibleMovesForWhite])

    //function to find if White King is in threat
    const findThreatToWhiteKing = (moves:allPossibleMovesType[] | allTempPossibleMovesType[], custBoard:string[][]) => {
        let row=0,col=0
        custBoard.forEach((r,i)=>{
            r.forEach((c,j)=>{
                if(c==="K"){
                    row=i
                    col=j
                }
            })
        })
        
        return moves.some((piece)=>
            piece.moves.some((move)=>
                move.row===row && move.col===col
            )
        )
        
    }

    //function to find if Black King is in threat
    const findThreatToBlackKing = (moves:allPossibleMovesType[] | allTempPossibleMovesType[], custBoard:string[][]) => {
        let row=0,col=0
        custBoard.forEach((r,i)=>{
            r.forEach((c,j)=>{
                if(c==="k"){
                    row=i
                    col=j
                }
            })
        })
        
        return moves.some((piece)=>
            piece.moves.some((move)=>
                move.row===row && move.col===col
            )
        )
    }

    //function to check if there is any square attacked in between king and rook before castling
    const checkMiddleSquaresAttacked = (colour:string, side:string) => {
        if(pieceColour===1){
            if(colour==="white"){
                if(side==="left"){
                    if(board[7][1]===" " && board[7][2]===" " && board[7][3]===" "){
                        return allPossibleMovesForBlack.some((piece)=>{
                            piece.moves.some((move)=>{
                                (move.row=== 7 && move.col===1) || (move.row===7 && move.col===2) || (move.row===7 && move.col===3)
                            })
                        })
                    }
                    else return true
                }
                else{
                    if(board[7][5]===" " && board[7][6]===" "){
                        return allPossibleMovesForBlack.some((piece)=>{
                            piece.moves.some((move)=>{
                                (move.row=== 7 && move.col===5) || (move.row===7 && move.col===6)
                            })
                        })
                    }
                    else return true
                }
            }
            else{
                if(side==="left"){
                    if(board[0][1]===" " && board[0][2]===" " && board[0][3]===" "){
                        return allPossibleMovesForWhite.some((piece)=>{
                            piece.moves.some((move)=>{
                                (move.row=== 0 && move.col===1) || (move.row===0 && move.col===2) || (move.row===0 && move.col===3)
                            })
                        })
                    }
                    else return true
                }
                else{
                    if(board[0][5]===" " && board[0][6]===" "){
                        return allPossibleMovesForWhite.some((piece)=>{
                            piece.moves.some((move)=>{
                                (move.row=== 0 && move.col===5) || (move.row===0 && move.col===6)
                            })
                        })
                    }
                    else return true
                }
            }
        }
        else{
            if(colour==="white"){
                if(side==="left"){
                    if(board[0][1]===" " && board[0][2]===" "){
                        return allPossibleMovesForBlack.some((piece)=>{
                            piece.moves.some((move)=>{
                                (move.row=== 0 && move.col===1) || (move.row===0 && move.col===2)
                            })
                        })
                    }
                    else return true
                }
                else{
                    if(board[0][4]===" " && board[0][5]===" " && board[0][6]===" "){
                        return allPossibleMovesForBlack.some((piece)=>{
                            piece.moves.some((move)=>{
                                (move.row=== 0 && move.col===4) || (move.row=== 0 && move.col===5) || (move.row===0 && move.col===6)
                            })
                        })
                    }
                    else return true
                }
            }
            else{
                if(side==="left"){
                    if(board[7][1]===" " && board[7][2]===" "){
                        return allPossibleMovesForWhite.some((piece)=>{
                            piece.moves.some((move)=>{
                                (move.row=== 7 && move.col===1) || (move.row===7 && move.col===2)
                            })
                        })
                    }
                    else return true
                }
                else{
                    if(board[7][4]===" " && board[7][5]===" " && board[7][6]===" "){
                        return allPossibleMovesForWhite.some((piece)=>{
                            piece.moves.some((move)=>{
                                (move.row=== 7 && move.col===4) || (move.row=== 7 && move.col===5) || (move.row===7 && move.col===6)
                            })
                        })
                    }
                    else return true
                }
            }
        }
    }

    //function to remove enpassed pawns if enpassant move happens
    const removeEnpassedPawns = (piece:string,row:number,col:number) => {
        setBoard((prevBoard)=>{
            const newBoard = [...prevBoard]
            newBoard[row] = [...prevBoard[row]]
            newBoard[row][col] = " "
            return newBoard
        })
        if (audioRefCapture.current) {
            audioRefCapture.current.volume=1
            audioRefCapture.current.play()
        }
    }

    //function to handle if a piece is selected i.e QRNP/qrnp if a pawn reaches last square
    const handlePawnToLastSquare = (updatedPiece:string) => {
        if(pawnToLastSquarePosi.piece!==null && pawnToLastSquarePosi.selRow!==null && pawnToLastSquarePosi.selCol!==null && pawnToLastSquarePosi.newRow!==null && pawnToLastSquarePosi.newCol!==null){
            const selRow = pawnToLastSquarePosi.selRow
            const selCol = pawnToLastSquarePosi.selCol
            const newRow = pawnToLastSquarePosi.newRow
            const newCol = pawnToLastSquarePosi.newCol
            const lastSquarePreviousPiece = board[newRow][newCol]
            setBoard((prevBoard)=>{
                const newBoard = [...prevBoard]
                newBoard[selRow] = [...prevBoard[selRow]]
                newBoard[newRow] = [...prevBoard[newRow]]
                newBoard[selRow][selCol] = " "
                newBoard[newRow][newCol] = updatedPiece
                if(user && opponent) socket.emit("updateBoard",user?.id.split(":")[2],opponent?.oppoUid,newBoard,moves+1)
                return newBoard
            })
            //set the allMoves i.e previousPiece and updatedPiece if pawn moves to lastsquare
            setAllMoves((prev) => {
                return [...prev.slice(0,prev.length-1),{...prev[prev.length - 1],lastSquareUpdatedPiece: updatedPiece,lastSquarePreviousPiece: lastSquarePreviousPiece}]
            })
            if(user && opponent) socket.emit("newMove",user?.id.split(":")[2],opponent?.oppoUid,null,updatedPiece,lastSquarePreviousPiece)
        }
        setPawnToLastSquarePosi({piece:null,selRow:null,selCol:null,newRow:null,newCol:null})
        setMoves((prev)=>prev+1)
        if (audioRefMove.current) {
            audioRefMove.current.volume=1
            audioRefMove.current.play()
        }
    }

    const handleRookPosiAfterCastling = (row:number, prevCol:number, newCol:number) => {
        setBoard((prevBoard)=>{
            const newBoard = [...prevBoard]
            newBoard[row] = [...prevBoard[row]]
            const piece = newBoard[row][prevCol]
            newBoard[row][prevCol] = " "
            newBoard[row][newCol] = piece
            return newBoard
        })
        if (audioRefCastle.current) {
            audioRefCastle.current.volume=1
            audioRefCastle.current.play()
        }
    }

    useEffect(()=>{
        if(opponent){
            const socket = io("http://localhost:3001")
            setSocket(socket)
            socket.on('boardUpdated', ({board,movesCount})=>{
                setBoard(board)
                setMoves(movesCount)
            })
            socket.on('updateMove', ({move,updatedPiece,lastSquarePreviousPiece})=>{
                if(updatedPiece===null && lastSquarePreviousPiece===null){
                    setAllMoves((prev)=>{return [...prev,move]})
                }
                else if(move===null){
                    setAllMoves((prev) => {
                        return [...prev.slice(0,prev.length-1),{...prev[prev.length - 1],lastSquareUpdatedPiece: updatedPiece,lastSquarePreviousPiece: lastSquarePreviousPiece}]
                    })
                }
            })
            return () => {
                socket.disconnect()
            }
        }
    },[])

    useEffect(()=>{
        if(ready && !authenticated){
            socket.emit("customDisconnect")
            router.push("/")

        }
        else if(ready && authenticated && socket){
            socket.emit("register",user?.id.split(":")[2])
        }
    },[ready, authenticated, socket])

    const updateSelectedPiecePosition = (selPiece:string,selRow:number,selCol:number,newRow:number,newCol:number) => {

        if(pieceColour===1){
            //remove the enpassant pawns if enpassant move happens
            if(selPiece==="P" && selRow===3 && allMoves[allMoves.length-1].piece==="p" && newRow===2 && newCol===allMoves[allMoves.length-1].toCol && allMoves[allMoves.length-1].toRow===3) removeEnpassedPawns("p",allMoves[allMoves.length-1].toRow,allMoves[allMoves.length-1].toCol)
            if(selPiece==="p" && selRow===4 && allMoves[allMoves.length-1].piece==="P" && newRow===5 && newCol===allMoves[allMoves.length-1].toCol && allMoves[allMoves.length-1].toRow===4) removeEnpassedPawns("P",allMoves[allMoves.length-1].toRow,allMoves[allMoves.length-1].toCol)
            //if pawns moves to last square
            if(selPiece==="P" && newRow===0) setPawnToLastSquarePosi({piece:"P",selRow:selRow,selCol:selCol,newRow:newRow,newCol:newCol})
            if(selPiece==="p" && newRow===7) setPawnToLastSquarePosi({piece:"p",selRow:selRow,selCol:selCol,newRow:newRow,newCol:newCol})

            //set that the castling is not possible if the rook is moved
            if(selPiece==="R" && selRow===7 && selCol===0 && whiteRookCastlePossible.left) setWhiteRookCastlePossible((prev)=>({...prev,left:false}))
            if(selPiece==="R" && selRow===7 && selCol===7 && whiteRookCastlePossible.right) setWhiteRookCastlePossible((prev)=>({...prev,right:false}))
            if(selPiece==="r" && selRow===0 && selCol===0 && blackRookCastlePossible.left) setBlackRookCastlePossible((prev)=>({...prev,left:false}))
            if(selPiece==="r" && selRow===0 && selCol===7 && blackRookCastlePossible.right) setBlackRookCastlePossible((prev)=>({...prev,right:false}))

            //set that the rook posi after castling              
            if(selPiece==="K" && selRow===7 && selCol===4){
                if(whiteKingCastlePossible && whiteRookCastlePossible.left && newRow===7 && newCol===2){
                    handleRookPosiAfterCastling(7,0,3)
                }
                if(whiteKingCastlePossible && whiteRookCastlePossible.right && newRow===7 && newCol===6){
                    handleRookPosiAfterCastling(7,7,5)
                }
                setWhiteKingCastlePossible(false)
            }
            if(selPiece==="k" && selRow===0 && selCol===4){
                if(blackKingCastlePossible && blackRookCastlePossible.left && newRow===0 && newCol===2){
                    handleRookPosiAfterCastling(0,0,3)
                }
                if(blackKingCastlePossible && blackRookCastlePossible.right && newRow===0 && newCol===6){
                    handleRookPosiAfterCastling(0,7,5)
                }
                setBlackKingCastlePossible(false)
            }
        }
        else{
            //remove the enpassant pawns if enpassant move happens
            if(selPiece==="P" && selRow===4 && allMoves[allMoves.length-1].piece==="p" && newRow===5 && newCol===allMoves[allMoves.length-1].toCol && allMoves[allMoves.length-1].toRow===4) removeEnpassedPawns("p",allMoves[allMoves.length-1].toRow,allMoves[allMoves.length-1].toCol)
            if(selPiece==="p" && selRow===3 && allMoves[allMoves.length-1].piece==="P" && newRow===2 && newCol===allMoves[allMoves.length-1].toCol && allMoves[allMoves.length-1].toRow===3) removeEnpassedPawns("P",allMoves[allMoves.length-1].toRow,allMoves[allMoves.length-1].toCol)
            //if pawns moves to last square
            if(selPiece==="P" && newRow===7) setPawnToLastSquarePosi({piece:"P",selRow:selRow,selCol:selCol,newRow:newRow,newCol:newCol})
            if(selPiece==="p" && newRow===0) setPawnToLastSquarePosi({piece:"p",selRow:selRow,selCol:selCol,newRow:newRow,newCol:newCol})

            //set that the castling is not possible if the rook is moved
            if(selPiece==="R" && selRow===0 && selCol===0 && whiteRookCastlePossible.left) setWhiteRookCastlePossible((prev)=>({...prev,left:false}))
            if(selPiece==="R" && selRow===0 && selCol===7 && whiteRookCastlePossible.right) setWhiteRookCastlePossible((prev)=>({...prev,right:false}))
            if(selPiece==="r" && selRow===7 && selCol===0 && blackRookCastlePossible.left) setBlackRookCastlePossible((prev)=>({...prev,left:false}))
            if(selPiece==="r" && selRow===7 && selCol===7 && blackRookCastlePossible.right) setBlackRookCastlePossible((prev)=>({...prev,right:false}))

            //set the rook posi after castling
            if(selPiece==="K" && selRow===0 && selCol===3){
                if(whiteKingCastlePossible && whiteRookCastlePossible.left && newRow===0 && newCol===1){
                    handleRookPosiAfterCastling(0,0,2)
                }
                if(whiteKingCastlePossible && whiteRookCastlePossible.right && newRow===0 && newCol===5){
                    handleRookPosiAfterCastling(0,7,4)
                }
                setWhiteKingCastlePossible(false)
            }
            if(selPiece==="k" && selRow===7 && selCol===3){
                if(blackKingCastlePossible && blackRookCastlePossible.left && newRow===7 && newCol===1){
                    handleRookPosiAfterCastling(7,0,2)
                }
                if(blackKingCastlePossible && blackRookCastlePossible.right && newRow===7 && newCol===5){
                    handleRookPosiAfterCastling(7,7,4)
                }
                setBlackKingCastlePossible(false)
            }
        }

        if(board[newRow][newCol]===" "){
            if (audioRefMove.current) {
                audioRefMove.current.volume=1
                audioRefMove.current.play()
            }
        }
        else{
            if (audioRefCapture.current) {
                audioRefCapture.current.volume=1
                audioRefCapture.current.play()
            }
        }

        //**set all the previous moves**
        //enpass move
        if((pieceColour===1 && selPiece==="P" && selRow===3 && allMoves[allMoves.length-1].piece==="p" && newRow===2 && newCol===allMoves[allMoves.length-1].toCol && allMoves[allMoves.length-1].toRow===3) || 
        (pieceColour===1 && selPiece==="p" && selRow===4 && allMoves[allMoves.length-1].piece==="P" && newRow===5 && newCol===allMoves[allMoves.length-1].toCol && allMoves[allMoves.length-1].toRow===4) ||
        (pieceColour===0 && selPiece==="P" && selRow===4 && allMoves[allMoves.length-1].piece==="p" && newRow===5 && newCol===allMoves[allMoves.length-1].toCol && allMoves[allMoves.length-1].toRow===4) ||
        (pieceColour===0 && selPiece==="p" && selRow===3 && allMoves[allMoves.length-1].piece==="P" && newRow===2 && newCol===allMoves[allMoves.length-1].toCol && allMoves[allMoves.length-1].toRow===3)){
            setAllMoves((prev)=>{return [...prev,{piece:selPiece,fromRow:selRow,fromCol:selCol,toRow:newRow,toCol:newCol,enpass:true}]})
            if(user && opponent) socket.emit("newMove",user?.id.split(":")[2],opponent?.oppoUid,{piece:selPiece,fromRow:7-selRow,fromCol:7-selCol,toRow:7-newRow,toCol:7-newCol,enpass:true},null,null)
        }
        //lastSquare move is set in handlePawnToLastSquare func

        //normal move
        else{
            setAllMoves((prev)=>{return [...prev,{piece:selPiece,fromRow:selRow,fromCol:selCol,toRow:newRow,toCol:newCol}]})
            if(user && opponent) socket.emit("newMove",user?.id.split(":")[2],opponent?.oppoUid,{piece:selPiece,fromRow:7-selRow,fromCol:7-selCol,toRow:7-newRow,toCol:7-newCol},null,null)
        }

        //update the selected piece position only when it is not pawn to last square
        if(!((pieceColour===1 && selPiece==="P" && newRow===0) ||
        (pieceColour===1 && selPiece==="p" && newRow===7) ||
        (pieceColour===0 && selPiece==="P" && newRow===7) ||
        (pieceColour===0 && selPiece==="p" && newRow===0))){
            setBoard((prevBoard)=>{
                const newBoard = [...prevBoard]
                newBoard[selRow] = [...prevBoard[selRow]]
                newBoard[newRow] = [...prevBoard[newRow]]
                newBoard[selRow][selCol] = " "
                newBoard[newRow][newCol] = selPiece
                if(user && opponent) socket.emit("updateBoard",user?.id.split(":")[2],opponent?.oppoUid,newBoard,moves+1)
                return newBoard
            })
            //increase the count of moves when pawn does not reach last square and when it reaches moves are updated in handlePawnToLastSquare func
            setMoves((prev)=>prev+1)
        }

    }

    const handleSelectedPiece = (piece:string,i:number,j:number) => {
        //1. select a piece is any other piece is not selected
        if(!isSelected){
            if(opponent){
                if((pieceColour===1 && moves%2===0 && whitePieces.includes(board[i][j])) || (pieceColour===0 && moves%2!==0 && blackPieces.includes(board[i][j]))){
                    setIsSelected(true)
                    setSelectedPiece({piece:piece,row:i,col:j})
                    setPossibleMovesForSelectedPiece([])
                }
            }
            else{
                if((pieceColour===1 && moves%2===0 && whitePieces.includes(board[i][j])) || (pieceColour===1 && moves%2!==0 && blackPieces.includes(board[i][j])) || (pieceColour===0 && moves%2===0 && whitePieces.includes(board[i][j])) || (pieceColour===0 && moves%2!==0 && blackPieces.includes(board[i][j]))){
                    setIsSelected(true)
                    setSelectedPiece({piece:piece,row:i,col:j})
                    setPossibleMovesForSelectedPiece([])
                }
            }
        }
        //2. deselect if same piece is selected again
        else if(isSelected && selectedPiece.piece===piece && selectedPiece.row===i && selectedPiece.col===j){
            setIsSelected(false)
            setSelectedPiece({piece:null,row:null,col:null})
        }
        //3. select if another same colour piece is selected
        else if(isSelected && ((opponent && ((pieceColour===1 && moves%2===0 && whitePieces.includes(board[i][j])) || (pieceColour===0 && moves%2!==0 && blackPieces.includes(board[i][j])))) || ((pieceColour===1 && moves%2===0 && whitePieces.includes(board[i][j])) || (pieceColour===1 && moves%2!==0 && blackPieces.includes(board[i][j])) || (pieceColour===0 && moves%2===0 && whitePieces.includes(board[i][j])) || (pieceColour===0 && moves%2!==0 && blackPieces.includes(board[i][j]))))){
            setPossibleMovesForSelectedPiece([])
            setIsSelected(true)
            setSelectedPiece({piece:piece,row:i,col:j})
        }
        //4. update
        else if (isSelected && selectedPiece.piece!==null && selectedPiece.row!==null && selectedPiece.col!==null && possibleMovesForSelectedPiece.some((m)=>m.row===i && m.col===j)) {

            //create a temporary array to update the board position and check the if the king is in threat after a move is made
            let updatedBoard:string[][] = [...board]
            updatedBoard[selectedPiece.row] = [...board[selectedPiece.row]]
            updatedBoard[i] = [...board[i]]
            updatedBoard[selectedPiece.row][selectedPiece.col] = " "
            updatedBoard[i][j] = selectedPiece.piece

            //if it is enpassant move
            if((pieceColour===1 && selectedPiece.piece==="P" && selectedPiece.row===3 && allMoves[allMoves.length-1].piece==="p" && i===2 && j===allMoves[allMoves.length-1].toCol && allMoves[allMoves.length-1].toRow===3)
            || (pieceColour===1 && selectedPiece.piece==="p" && selectedPiece.row===4 && allMoves[allMoves.length-1].piece==="P" && i===5 && j===allMoves[allMoves.length-1].toCol && allMoves[allMoves.length-1].toRow===4)
            || (pieceColour===0 && selectedPiece.piece==="P" && selectedPiece.row===4 && allMoves[allMoves.length-1].piece==="p" && i===5 && j===allMoves[allMoves.length-1].toCol && allMoves[allMoves.length-1].toRow===4) 
            || (pieceColour===0 && selectedPiece.piece==="p" && selectedPiece.row===3 && allMoves[allMoves.length-1].piece==="P" && i===2 && j===allMoves[allMoves.length-1].toCol && allMoves[allMoves.length-1].toRow===3))
            {
                updatedBoard[allMoves[allMoves.length-1].toRow][allMoves[allMoves.length-1].toCol] = " "
            }

            //for all the pieces check possible moves and find if opponent king is in threat
            if((pieceColour===1 && moves%2===0) || (pieceColour===0 && moves%2===0)){
                let arr:allTempPossibleMovesType[] = []
                updatedBoard.map((r,rind)=>{
                    r.map((c,cind)=>{
                        if(blackPieces.includes(c)){
                            if(c==="p") arr.push(findMovesForp(rind,cind,false,updatedBoard))
                            if(c==="n") arr.push(findMovesForn(rind,cind,false,updatedBoard))
                            if(c==="r") arr.push(findMovesForr(rind,cind,false,updatedBoard))
                            if(c==="b") arr.push(findMovesForb(rind,cind,false,updatedBoard))
                            if(c==="q") arr.push(findMovesForq(rind,cind,false,updatedBoard))
                        }
                    })
                })
                const ifWhiteKingInThreat = findThreatToWhiteKing(arr,updatedBoard)
                if(!ifWhiteKingInThreat){
                    updateSelectedPiecePosition(selectedPiece.piece, selectedPiece.row, selectedPiece.col, i, j)
                }

            }
            else{
                let arr:allTempPossibleMovesType[] = []
                updatedBoard.map((r,rind)=>{
                    r.map((c,cind)=>{
                        if(whitePieces.includes(c)){
                            if(c==="P") arr.push(findMovesForP(rind,cind,false,updatedBoard))
                            if(c==="N") arr.push(findMovesForN(rind,cind,false,updatedBoard))
                            if(c==="R") arr.push(findMovesForR(rind,cind,false,updatedBoard))
                            if(c==="B") arr.push(findMovesForB(rind,cind,false,updatedBoard))
                            if(c==="Q") arr.push(findMovesForQ(rind,cind,false,updatedBoard))
                        }
                    })
                })
                const ifBlackKingInThreat = findThreatToBlackKing(arr,updatedBoard)
                if(!ifBlackKingInThreat){
                    updateSelectedPiecePosition(selectedPiece.piece, selectedPiece.row, selectedPiece.col, i, j)
                }
            }

            setIsSelected(false)
            setSelectedPiece({piece:null,row:null,col:null})
            setPossibleMovesForSelectedPiece([])
        }
    }

    //Set possible moves for a selected piece
    useEffect(()=>{
        if(isSelected){
            if(opponent){
                if(pieceColour===1){
                    const possibleMovesForPieceIfWhite = allPossibleMovesForWhite.find((item)=>(item.piece===selectedPiece.piece && item.posi.row===selectedPiece.row && item.posi.col===selectedPiece.col))
                    if(possibleMovesForPieceIfWhite) setPossibleMovesForSelectedPiece(possibleMovesForPieceIfWhite?.moves)
                }
                else{
                    const possibleMovesForPieceIfBlack = allPossibleMovesForBlack.find((item)=>(item.piece===selectedPiece.piece && item.posi.row===selectedPiece.row && item.posi.col===selectedPiece.col))
                    if(possibleMovesForPieceIfBlack) setPossibleMovesForSelectedPiece(possibleMovesForPieceIfBlack?.moves)
                }
            }
            else{
                if((pieceColour===1 && moves%2===0) || (pieceColour===0 && moves%2===0)){
                    const possibleMovesForPieceIfWhite = allPossibleMovesForWhite.find((item)=>(item.piece===selectedPiece.piece && item.posi.row===selectedPiece.row && item.posi.col===selectedPiece.col))
                    if(possibleMovesForPieceIfWhite) setPossibleMovesForSelectedPiece(possibleMovesForPieceIfWhite?.moves)
                }
                else{
                    const possibleMovesForPieceIfBlack = allPossibleMovesForBlack.find((item)=>(item.piece===selectedPiece.piece && item.posi.row===selectedPiece.row && item.posi.col===selectedPiece.col))
                    if(possibleMovesForPieceIfBlack) setPossibleMovesForSelectedPiece(possibleMovesForPieceIfBlack?.moves)
                }
            }
        }
        else{
            setPossibleMovesForSelectedPiece([])
        }
    },[isSelected,selectedPiece])

    //WHITE PAWN MOVES
    //1.one move 2.two moves 3&4.attack diagonally 6&7.if pawn protects any piece 9&10.enpassant move
    const findMovesForP = (row:number, col:number, forRealBoard:boolean, Board:string[][]) => {
        const movesArray:{row:number,col:number}[] = []
        const protectedArray:{row:number,col:number}[] = []
        if(pieceColour===1){
            if(row>0 && Board[row-1][col]===" ") movesArray.push({row:row-1,col:col})
            if(row===6 && Board[row-2][col]===" " && Board[row-1][col]===" ") movesArray.push({row:row-2,col:col})
            if(row>0 && col>0 && blackPieces.includes(Board[row-1][col-1])) movesArray.push({row:row-1,col:col-1})
            if(row>0 && col<7 && blackPieces.includes(Board[row-1][col+1])) movesArray.push({row:row-1,col:col+1})
            if(forRealBoard){
                if(row>0 && col>0 && whitePieces.includes(Board[row-1][col-1])) protectedArray.push({row:row-1,col:col-1})
                if(row>0 && col<7 && whitePieces.includes(Board[row-1][col+1])) protectedArray.push({row:row-1,col:col+1})
            }
            if(row===3 && col>0 && allMoves.length>0 && allMoves[allMoves.length-1].piece && Board[row][col-1]==="p" && allMoves[allMoves.length-1].piece==="p" && allMoves[allMoves.length-1].toRow===3 && allMoves[allMoves.length-1].toCol===col-1) movesArray.push({row:row-1,col:col-1})
            if(row===3 && col<7 && allMoves.length>0 && allMoves[allMoves.length-1].piece && Board[row][col+1]==="p" && allMoves[allMoves.length-1].piece==="p" && allMoves[allMoves.length-1].toRow===3 && allMoves[allMoves.length-1].toCol===col+1) movesArray.push({row:row-1,col:col+1})
        }
        else{
            if(row<7 && Board[row+1][col]===" ") movesArray.push({row:row+1,col:col})
            if(row===1 && Board[row+2][col]===" " && Board[row+1][col]===" ") movesArray.push({row:row+2,col:col})
            if(row<7 && col<7 && blackPieces.includes(Board[row+1][col+1])) movesArray.push({row:row+1,col:col+1})
            if(row<7 && col>0 && blackPieces.includes(Board[row+1][col-1])) movesArray.push({row:row+1,col:col-1})
            if(forRealBoard){
                if(row<7 && col<7 && whitePieces.includes(Board[row+1][col+1])) protectedArray.push({row:row+1,col:col+1})
                if(row<7 && col>0 && whitePieces.includes(Board[row+1][col-1])) protectedArray.push({row:row+1,col:col-1})
            }
            if(row===4 && col>0 && allMoves.length>0 && allMoves[allMoves.length-1].piece && Board[row][col-1]==="p" && allMoves[allMoves.length-1].piece==="p" && allMoves[allMoves.length-1].toRow===4 && allMoves[allMoves.length-1].toCol===col-1) movesArray.push({row:row+1,col:col-1})
            if(row===4 && col<7 && allMoves.length>0 && allMoves[allMoves.length-1].piece && Board[row][col+1]==="p" && allMoves[allMoves.length-1].piece==="p" && allMoves[allMoves.length-1].toRow===4 && allMoves[allMoves.length-1].toCol===col+1) movesArray.push({row:row+1,col:col+1})
        }
        if(forRealBoard) return {piece:"P",posi:{row:row,col:col},moves:movesArray,protected:protectedArray}
        else return {piece:"P",posi:{row:row,col:col},moves:movesArray}
    }

    //BLACK PAWN MOVES
    //1.one move 2.two moves 3&4.attack diagonally 6&7.if pawn protects any piece 9&10.enpassant move
    const findMovesForp = (row:number, col:number, forRealBoard:boolean, Board:string[][]) => {
        const movesArray:{row:number,col:number}[] = []
        const protectedArray:{row:number,col:number}[] = []
        if(pieceColour===1){
            if(row<7 && Board[row+1][col]===" ") movesArray.push({row:row+1,col:col})
            if(row===1 && Board[row+2][col]===" " && Board[row+1][col]===" ") movesArray.push({row:row+2,col:col})
            if(row<7 && col<7 && whitePieces.includes(Board[row+1][col+1])) movesArray.push({row:row+1,col:col+1})
            if(row<7 && col>0 && whitePieces.includes(Board[row+1][col-1])) movesArray.push({row:row+1,col:col-1})
            if(forRealBoard){
                if(row<7 && col<7 && blackPieces.includes(Board[row+1][col+1])) protectedArray.push({row:row+1,col:col+1})
                if(row<7 && col>0 && blackPieces.includes(Board[row+1][col-1])) protectedArray.push({row:row+1,col:col-1})
            }
            if(row===4 && col>0 && allMoves.length>0 && allMoves[allMoves.length-1].piece && Board[row][col-1]==="P" && allMoves[allMoves.length-1].piece==="P" && allMoves[allMoves.length-1].toRow===4 && allMoves[allMoves.length-1].toCol===col-1) movesArray.push({row:row+1,col:col-1})
            if(row===4 && col<7 && allMoves.length>0 && allMoves[allMoves.length-1].piece && Board[row][col+1]==="P" && allMoves[allMoves.length-1].piece==="P" && allMoves[allMoves.length-1].toRow===4 && allMoves[allMoves.length-1].toCol===col+1) movesArray.push({row:row+1,col:col+1})
            
        }
        else{
            if(row>0 && Board[row-1][col]===" ") movesArray.push({row:row-1,col:col})
            if(row===6 && Board[row-2][col]===" " && Board[row-1][col]===" ") movesArray.push({row:row-2,col:col})
            if(row>0 && col>0 && whitePieces.includes(Board[row-1][col-1])) movesArray.push({row:row-1,col:col-1})
            if(row>0 && col<7 && whitePieces.includes(Board[row-1][col+1])) movesArray.push({row:row-1,col:col+1})
            if(forRealBoard){
                if(row>0 && col>0 && blackPieces.includes(Board[row-1][col-1])) protectedArray.push({row:row-1,col:col-1})
                if(row>0 && col<7 && blackPieces.includes(Board[row-1][col+1])) protectedArray.push({row:row-1,col:col+1})
            }
            if(row===3 && col>0 && allMoves.length>0 && allMoves[allMoves.length-1].piece && Board[row][col-1]==="P" && allMoves[allMoves.length-1].piece==="P" && allMoves[allMoves.length-1].toRow===3 && allMoves[allMoves.length-1].toCol===col-1) movesArray.push({row:row-1,col:col-1})
            if(row===3 && col<7 && allMoves.length>0 && allMoves[allMoves.length-1].piece && Board[row][col+1]==="P" && allMoves[allMoves.length-1].piece==="P" && allMoves[allMoves.length-1].toRow===3 && allMoves[allMoves.length-1].toCol===col+1) movesArray.push({row:row-1,col:col+1})
        }
        if(forRealBoard) return {piece:"p",posi:{row:row,col:col},moves:movesArray,protected:protectedArray}
        else return {piece:"p",posi:{row:row,col:col},moves:movesArray}
    }

    //WHITE KNIGHT MOVES
    const findMovesForN = (row:number, col:number, forRealBoard:boolean, Board:string[][]) => {
        const movesArray:{row:number,col:number}[] = []
        const protectedArray:{row:number,col:number}[] = []
        //BIG L
        if(row-2>=0 && col+1<8 && !whitePieces.includes(Board[row-2][col+1])) movesArray.push({row:row-2,col:col+1})
        if(row-2>=0 && col-1>=0 && !whitePieces.includes(Board[row-2][col-1])) movesArray.push({row:row-2,col:col-1})
        if(row+2<8 && col+1<8 && !whitePieces.includes(Board[row+2][col+1])) movesArray.push({row:row+2,col:col+1})
        if(row+2<8 && col-1>=0 && !whitePieces.includes(Board[row+2][col-1])) movesArray.push({row:row+2,col:col-1})
        
        if(forRealBoard){
            if(row-2>=0 && col+1<8 && whitePieces.includes(Board[row-2][col+1])) protectedArray.push({row:row-2,col:col+1})
            if(row-2>=0 && col-1>=0 && whitePieces.includes(Board[row-2][col-1])) protectedArray.push({row:row-2,col:col-1})
            if(row+2<8 && col+1<8 && whitePieces.includes(Board[row+2][col+1])) protectedArray.push({row:row+2,col:col+1})
            if(row+2<8 && col-1>=0 && whitePieces.includes(Board[row+2][col-1])) protectedArray.push({row:row+2,col:col-1})
        }

        //SMALL L
        if(row-1>=0 && col+2<8 && !whitePieces.includes(Board[row-1][col+2])) movesArray.push({row:row-1,col:col+2})
        if(row-1>=0 && col-2>=0 && !whitePieces.includes(Board[row-1][col-2])) movesArray.push({row:row-1,col:col-2})
        if(row+1<8 && col+2<8 && !whitePieces.includes(Board[row+1][col+2])) movesArray.push({row:row+1,col:col+2})
        if(row+1<8 && col-2>=0 && !whitePieces.includes(Board[row+1][col-2])) movesArray.push({row:row+1,col:col-2})

        if(forRealBoard){
            if(row-1>=0 && col+2<8 && whitePieces.includes(Board[row-1][col+2])) protectedArray.push({row:row-1,col:col+2})
            if(row-1>=0 && col-2>=0 && whitePieces.includes(Board[row-1][col-2])) protectedArray.push({row:row-1,col:col-2})
            if(row+1<8 && col+2<8 && whitePieces.includes(Board[row+1][col+2])) protectedArray.push({row:row+1,col:col+2})
            if(row+1<8 && col-2>=0 && whitePieces.includes(Board[row+1][col-2])) protectedArray.push({row:row+1,col:col-2})
        }

        if(forRealBoard){
            if(movesArray.length>0) return {piece:"N",posi:{row:row,col:col},moves:movesArray,protected:protectedArray}
            else return {piece:"N",posi:{row:row,col:col},moves:[],protected:protectedArray}
        }
        else return {piece:"N",posi:{row:row,col:col},moves:movesArray}
    }

    //BLACK KNIGHT MOVES
    const findMovesForn = (row:number, col:number, forRealBoard:boolean, Board:string[][]) => {
        const movesArray:{row:number,col:number}[] = []
        const protectedArray:{row:number,col:number}[] = []
        //BIG L
        if(row+2<8 && col+1<8 && !blackPieces.includes(Board[row+2][col+1])) movesArray.push({row:row+2,col:col+1})        
        if(row+2<8 && col-1>=0 && !blackPieces.includes(Board[row+2][col-1])) movesArray.push({row:row+2,col:col-1})
        if(row-2>=0 && col+1<8 && !blackPieces.includes(Board[row-2][col+1])) movesArray.push({row:row-2,col:col+1})
        if(row-2>=0 && col-1>=0 && !blackPieces.includes(Board[row-2][col-1])) movesArray.push({row:row-2,col:col-1})

        if(forRealBoard){
            if(row+2<8 && col+1<8 && blackPieces.includes(Board[row+2][col+1])) protectedArray.push({row:row+2,col:col+1})        
            if(row+2<8 && col-1>=0 && blackPieces.includes(Board[row+2][col-1])) protectedArray.push({row:row+2,col:col-1})
            if(row-2>=0 && col+1<8 && blackPieces.includes(Board[row-2][col+1])) protectedArray.push({row:row-2,col:col+1})
            if(row-2>=0 && col-1>=0 && blackPieces.includes(Board[row-2][col-1])) protectedArray.push({row:row-2,col:col-1})
        }

        //SMALL L
        if(row+1<8 && col+2<8 && !blackPieces.includes(Board[row+1][col+2])) movesArray.push({row:row+1,col:col+2})
        if(row+1<8 && col-2>=0 && !blackPieces.includes(Board[row+1][col-2])) movesArray.push({row:row+1,col:col-2})
        if(row-1>=0 && col+2<8 && !blackPieces.includes(Board[row-1][col+2])) movesArray.push({row:row-1,col:col+2})
        if(row-1>=0 && col-2>=0 && !blackPieces.includes(Board[row-1][col-2])) movesArray.push({row:row-1,col:col-2})

        if(forRealBoard){
            if(row+1<8 && col+2<8 && blackPieces.includes(Board[row+1][col+2])) protectedArray.push({row:row+1,col:col+2})
            if(row+1<8 && col-2>=0 && blackPieces.includes(Board[row+1][col-2])) protectedArray.push({row:row+1,col:col-2})
            if(row-1>=0 && col+2<8 && blackPieces.includes(Board[row-1][col+2])) protectedArray.push({row:row-1,col:col+2})
            if(row-1>=0 && col-2>=0 && blackPieces.includes(Board[row-1][col-2])) protectedArray.push({row:row-1,col:col-2})
        }

        if(forRealBoard){
            if(movesArray.length>0) return {piece:"n",posi:{row:row,col:col},moves:movesArray,protected:protectedArray}
            else return {piece:"n",posi:{row:row,col:col},moves:[],protected:protectedArray}
        }
        else return {piece:"n",posi:{row:row,col:col},moves:movesArray,protected:protectedArray}
    }

    //WHITE ROOK MOVES
    const findMovesForR = (row:number, col:number, forRealBoard:boolean, Board:string[][]) => {
        const movesArray:{row:number,col:number}[] = []
        const protectedArray:{row:number,col:number}[] = []
        for(let i=row+1;i<8;i++){
            if(Board[i][col]===" ") movesArray.push({row:i,col:col})
            else if(blackPieces.includes(Board[i][col])){
                movesArray.push({row:i,col:col})
                break
            }
            else if(forRealBoard){
                protectedArray.push({row:i,col:col})
                break
            }
            else break
        }
        for(let i=row-1;i>=0;i--){
            if(Board[i][col]===" ") movesArray.push({row:i,col:col})
            else if(blackPieces.includes(Board[i][col])){
                movesArray.push({row:i,col:col})
                break
            }
            else if(forRealBoard){
                protectedArray.push({row:i,col:col})
                break
            }
            else break
        }
        for(let i=col+1;i<8;i++){
            if(Board[row][i]===" ") movesArray.push({row:row,col:i})
            else if(blackPieces.includes(Board[row][i])){
                movesArray.push({row:row,col:i})
                break
            }
            else if(forRealBoard){
                protectedArray.push({row:row,col:i})
                break
            }
            else break
        }
        for(let i=col-1;i>=0;i--){
            if(Board[row][i]===" ") movesArray.push({row:row,col:i})
            else if(blackPieces.includes(Board[row][i])){
                movesArray.push({row:row,col:i})
                break
            }
            else if(forRealBoard){
                protectedArray.push({row:row,col:i})
                break
            }
            else break
        }
        if(forRealBoard){
            if(movesArray.length>0) return {piece:"R",posi:{row:row,col:col},moves:movesArray,protected:protectedArray}
            else return {piece:"R",posi:{row:row,col:col},moves:[],protected:protectedArray}
        }
        else return {piece:"R",posi:{row:row,col:col},moves:movesArray}
    }

    //BLACK ROOK MOVES
    const findMovesForr = (row:number, col:number, forRealBoard:boolean, Board:string[][]) => {
        const movesArray:{row:number,col:number}[] = []
        const protectedArray:{row:number,col:number}[] = []
        for(let i=row+1;i<8;i++){
            if(Board[i][col]===" ") movesArray.push({row:i,col:col})
            else if(whitePieces.includes(Board[i][col])){
                movesArray.push({row:i,col:col})
                break
            }
            else if(forRealBoard){
                protectedArray.push({row:i,col:col})
                break
            }
            else break
        }
        for(let i=row-1;i>=0;i--){
            if(Board[i][col]===" ") movesArray.push({row:i,col:col})
            else if(whitePieces.includes(Board[i][col])){
                movesArray.push({row:i,col:col})
                break
            }
            else if(forRealBoard){
                protectedArray.push({row:i,col:col})
                break
            }
            else break
        }
        for(let i=col+1;i<8;i++){
            if(Board[row][i]===" ") movesArray.push({row:row,col:i})
            else if(whitePieces.includes(Board[row][i])){
                movesArray.push({row:row,col:i})
                break
            }
            else if(forRealBoard){
                protectedArray.push({row:row,col:i})
                break
            }
            else break
        }
        for(let i=col-1;i>=0;i--){
            if(Board[row][i]===" ") movesArray.push({row:row,col:i})
            else if(whitePieces.includes(Board[row][i])){
                movesArray.push({row:row,col:i})
                break
            }
            else if(forRealBoard){
                protectedArray.push({row:row,col:i})
                break
            }
            else break
        }
        if(forRealBoard){
            if(movesArray.length>0) return {piece:"r",posi:{row:row,col:col},moves:movesArray,protected:protectedArray}
            else return {piece:"r",posi:{row:row,col:col},moves:[],protected:protectedArray}
        }
        else return {piece:"r",posi:{row:row,col:col},moves:movesArray}
    }

    //WHITE BISHOP MOVES
    const findMovesForB = (row:number, col:number, forRealBoard:boolean, Board:string[][]) => {
        const movesArray:{row:number,col:number}[] = []
        const protectedArray:{row:number,col:number}[] = []
        let tempCol = col
        for(let i=row-1;i>=0 && col-1>=0;i--){
            if(Board[i][col-1]===" ") movesArray.push({row:i,col:col-1})
            else if(blackPieces.includes(Board[i][col-1])){
                movesArray.push({row:i,col:col-1})
                break
            }
            else if(forRealBoard){
                protectedArray.push({row:i,col:col-1})
                break
            }
            else break
            col-=1
        }
        col=tempCol
        for(let i=row-1;i>=0 && col+1<8;i--){
            if(Board[i][col+1]===" ") movesArray.push({row:i,col:col+1})
            else if(blackPieces.includes(Board[i][col+1])){
                movesArray.push({row:i,col:col+1})
                break
            }
            else if(forRealBoard){
                protectedArray.push({row:i,col:col+1})
                break
            }
            else break
            col+=1
        }
        col=tempCol
        for(let i=row+1;i<8 && col-1>=0;i++){
            if(Board[i][col-1]===" ") movesArray.push({row:i,col:col-1})
            else if(blackPieces.includes(Board[i][col-1])){
                movesArray.push({row:i,col:col-1})
                break
            }
            else if(forRealBoard){
                protectedArray.push({row:i,col:col-1})
                break
            }
            else break
            col-=1
        }
        col=tempCol
        for(let i=row+1;i<8 && col+1<8;i++){
            if(Board[i][col+1]===" ") movesArray.push({row:i,col:col+1})
            else if(blackPieces.includes(Board[i][col+1])){
                movesArray.push({row:i,col:col+1})
                break
            }
            else if(forRealBoard){
                protectedArray.push({row:i,col:col+1})
                break
            }
            else break
            col+=1
        }
        col=tempCol

        if(forRealBoard){
            if(movesArray.length>0) return {piece:"B",posi:{row:row,col:col},moves:movesArray,protected:protectedArray}
            else return {piece:"B",posi:{row:row,col:col},moves:[],protected:protectedArray}
        }
        else return {piece:"B",posi:{row:row,col:col},moves:movesArray}
    }

    //BLACK BISHOP MOVES
    const findMovesForb = (row:number, col:number, forRealBoard:boolean, Board:string[][]) => {
        const movesArray:{row:number,col:number}[] = []
        const protectedArray:{row:number,col:number}[] = []
        let tempCol = col
        for(let i=row-1;i>=0 && col-1>=0;i--){
            if(Board[i][col-1]===" ") movesArray.push({row:i,col:col-1})
            else if(whitePieces.includes(Board[i][col-1])){
                movesArray.push({row:i,col:col-1})
                break
            }
            else if(forRealBoard){
                protectedArray.push({row:i,col:col-1})
                break
            }
            else break
            col-=1
        }
        col=tempCol
        for(let i=row-1;i>=0 && col+1<8;i--){
            if(Board[i][col+1]===" ") movesArray.push({row:i,col:col+1})
            else if(whitePieces.includes(Board[i][col+1])){
                movesArray.push({row:i,col:col+1})
                break
            }
            else if(forRealBoard){
                protectedArray.push({row:i,col:col+1})
                break
            }
            else break
            col+=1
        }
        col=tempCol
        for(let i=row+1;i<8 && col-1>=0;i++){
            if(Board[i][col-1]===" ") movesArray.push({row:i,col:col-1})
            else if(whitePieces.includes(Board[i][col-1])){
                movesArray.push({row:i,col:col-1})
                break
            }
            else if(forRealBoard){
                protectedArray.push({row:i,col:col-1})
                break
            }
            else break
            col-=1
        }
        col=tempCol
        for(let i=row+1;i<8 && col+1<8;i++){
            if(Board[i][col+1]===" ") movesArray.push({row:i,col:col+1})
            else if(whitePieces.includes(Board[i][col+1])){
                movesArray.push({row:i,col:col+1})
                break
            }
            else if(forRealBoard){
                protectedArray.push({row:i,col:col+1})
                break
            }
            else break
            col+=1
        }
        col=tempCol
        if(forRealBoard){
            if(movesArray.length>0) return {piece:"b",posi:{row:row,col:col},moves:movesArray,protected:protectedArray}
            else return {piece:"b",posi:{row:row,col:col},moves:[],protected:protectedArray}
        }
        else return {piece:"b",posi:{row:row,col:col},moves:movesArray}
    }

    //WHITE QUEEN MOVES
    const findMovesForQ = (row:number, col:number, forRealBoard:boolean, Board:string[][]) => {
        const movesArray:{row:number,col:number}[] = []
        const protectedArray:{row:number,col:number}[] = []
        //ROOK MOVES
        for(let i=row+1;i<8;i++){
            if(Board[i][col]===" ") movesArray.push({row:i,col:col})
            else if(blackPieces.includes(Board[i][col])){
                movesArray.push({row:i,col:col})
                break
            }
            else if(forRealBoard){
                protectedArray.push({row:i,col:col})
                break
            }
            else break
        }
        for(let i=row-1;i>=0;i--){
            if(Board[i][col]===" ") movesArray.push({row:i,col:col})
            else if(blackPieces.includes(Board[i][col])){
                movesArray.push({row:i,col:col})
                break
            }
            else if(forRealBoard){
                protectedArray.push({row:i,col:col})
                break
            }
            else break
        }
        for(let i=col+1;i<8;i++){
            if(Board[row][i]===" ") movesArray.push({row:row,col:i})
            else if(blackPieces.includes(Board[row][i])){
                movesArray.push({row:row,col:i})
                break
            }
            else if(forRealBoard){
                protectedArray.push({row:row,col:i})
                break
            }
            else break
        }
        for(let i=col-1;i>=0;i--){
            if(Board[row][i]===" ") movesArray.push({row:row,col:i})
            else if(blackPieces.includes(Board[row][i])){
                movesArray.push({row:row,col:i})
                break
            }
            else if(forRealBoard){
                protectedArray.push({row:row,col:i})
                break
            }
            else break
        }

        //BISHOP MOVES
        let tempCol = col
        for(let i=row-1;i>=0 && col-1>=0;i--){
            if(Board[i][col-1]===" ") movesArray.push({row:i,col:col-1})
            else if(blackPieces.includes(Board[i][col-1])){
                movesArray.push({row:i,col:col-1})
                break
            }
            else if(forRealBoard){
                protectedArray.push({row:i,col:col-1})
                break
            }
            else break
            col-=1
        }
        col=tempCol
        for(let i=row-1;i>=0 && col+1<8;i--){
            if(Board[i][col+1]===" ") movesArray.push({row:i,col:col+1})
            else if(blackPieces.includes(Board[i][col+1])){
                movesArray.push({row:i,col:col+1})
                break
            }
            else if(forRealBoard){
                protectedArray.push({row:i,col:col+1})
                break
            }
            else break
            col+=1
        }
        col=tempCol
        for(let i=row+1;i<8 && col-1>=0;i++){
            if(Board[i][col-1]===" ") movesArray.push({row:i,col:col-1})
            else if(blackPieces.includes(Board[i][col-1])){
                movesArray.push({row:i,col:col-1})
                break
            }
            else if(forRealBoard){
                protectedArray.push({row:i,col:col-1})
                break
            }
            else break
            col-=1
        }
        col=tempCol
        for(let i=row+1;i<8 && col+1<8;i++){
            if(Board[i][col+1]===" ") movesArray.push({row:i,col:col+1})
            else if(blackPieces.includes(Board[i][col+1])){
                movesArray.push({row:i,col:col+1})
                break
            }
            else if(forRealBoard){
                protectedArray.push({row:i,col:col+1})
                break
            }
            else break
            col+=1
        }
        col=tempCol
        if(forRealBoard){
            if(movesArray.length>0) return {piece:"Q",posi:{row:row,col:col},moves:movesArray,protected:protectedArray}
            else return {piece:"Q",posi:{row:row,col:col},moves:[],protected:protectedArray}
        }
        else return {piece:"Q",posi:{row:row,col:col},moves:movesArray}
    }

    //BLACK QUEEN MOVES
    const findMovesForq = (row:number, col:number, forRealBoard:boolean, Board:string[][]) => {
        const movesArray:{row:number,col:number}[] = []
        const protectedArray:{row:number,col:number}[] = []
        //ROOK MOVES
        for(let i=row+1;i<8;i++){
            if(Board[i][col]===" ") movesArray.push({row:i,col:col})
            else if(whitePieces.includes(Board[i][col])){
                movesArray.push({row:i,col:col})
                break
            }
            else if(forRealBoard){
                protectedArray.push({row:i,col:col})
                break
            }
            else break
        }
        for(let i=row-1;i>=0;i--){
            if(Board[i][col]===" ") movesArray.push({row:i,col:col})
            else if(whitePieces.includes(Board[i][col])){
                movesArray.push({row:i,col:col})
                break
            }
            else if(forRealBoard){
                protectedArray.push({row:i,col:col})
                break
            }
            else break
        }
        for(let i=col+1;i<8;i++){
            if(Board[row][i]===" ") movesArray.push({row:row,col:i})
            else if(whitePieces.includes(Board[row][i])){
                movesArray.push({row:row,col:i})
                break
            }
            else if(forRealBoard){
                protectedArray.push({row:row,col:i})
                break
            }
            else break
        }
        for(let i=col-1;i>=0;i--){
            if(Board[row][i]===" ") movesArray.push({row:row,col:i})
            else if(whitePieces.includes(Board[row][i])){
                movesArray.push({row:row,col:i})
                break
            }
            else if(forRealBoard){
                protectedArray.push({row:row,col:i})
                break
            }
            else break
        }

        //BISHOP MOVES
        let tempCol = col
        for(let i=row-1;i>=0 && col-1>=0;i--){
            if(Board[i][col-1]===" ") movesArray.push({row:i,col:col-1})
            else if(whitePieces.includes(Board[i][col-1])){
                movesArray.push({row:i,col:col-1})
                break
            }
            else if(forRealBoard){
                protectedArray.push({row:i,col:col-1})
                break
            }
            else break
            col-=1
        }
        col=tempCol
        for(let i=row-1;i>=0 && col+1<8;i--){
            if(Board[i][col+1]===" ") movesArray.push({row:i,col:col+1})
            else if(whitePieces.includes(Board[i][col+1])){
                movesArray.push({row:i,col:col+1})
                break
            }
            else if(forRealBoard){
                protectedArray.push({row:i,col:col+1})
                break
            }
            else break
            col+=1
        }

        col=tempCol
        for(let i=row+1;i<8 && col-1>=0;i++){
            if(Board[i][col-1]===" ") movesArray.push({row:i,col:col-1})
            else if(whitePieces.includes(Board[i][col-1])){
                movesArray.push({row:i,col:col-1})
                break
            }
            else if(forRealBoard){
                protectedArray.push({row:i,col:col-1})
                break
            }
            else break
            col-=1
        }
        col=tempCol
        for(let i=row+1;i<8 && col+1<8;i++){
            if(Board[i][col+1]===" ") movesArray.push({row:i,col:col+1})
            else if(whitePieces.includes(Board[i][col+1])){
                movesArray.push({row:i,col:col+1})
                break
            }
            else if(forRealBoard){
                protectedArray.push({row:i,col:col+1})
                break
            }
            else break
            col+=1
        }
        col=tempCol
        if(forRealBoard){
            if(movesArray.length>0) return {piece:"q",posi:{row:row,col:col},moves:movesArray,protected:protectedArray}
            else return {piece:"q",posi:{row:row,col:col},moves:[],protected:protectedArray}
        }
        else return {piece:"q",posi:{row:row,col:col},moves:movesArray}
    }

    const filterMovesForWhiteKing = (row:number, col:number, movesArray: { row: number, col: number }[]) => {
        const removeMoves:{ row: number, col: number }[] = []
        const filteredMovesArray = movesArray.filter((move) => {
            return !allPossibleMovesForBlack.some((expiece) => {
                if (expiece.piece === "p") {
                    if (pieceColour === 1) {
                        return (
                            (expiece.posi.row + 1 === move.row && expiece.posi.col + 1 === move.col) ||
                            (expiece.posi.row + 1 === move.row && expiece.posi.col - 1 === move.col)
                        )
                    } else {
                        return (
                            (expiece.posi.row - 1 === move.row && expiece.posi.col + 1 === move.col) ||
                            (expiece.posi.row - 1 === move.row && expiece.posi.col - 1 === move.col)
                        )
                    }
                }
                else if(expiece.piece==="r"){
                    const isSameRow = expiece.posi.row===row
                    const isSameCol = expiece.posi.col===col
                    const ifAttacked = expiece.moves.some(
                        (exmove) => exmove.row === move.row && exmove.col === move.col
                    )
                    if(ifAttacked && isSameRow){
                        if(col<expiece.posi.col) removeMoves.push({row:row,col:col-1})
                        else removeMoves.push({row:row,col:col+1})
                    }
                    if(ifAttacked && isSameCol){
                        if(expiece.posi.row<row) removeMoves.push({row:row+1,col:col})
                        else removeMoves.push({row:row-1,col:col})
                    }
                    return expiece.moves.some(
                        (exmove) => exmove.row === move.row && exmove.col === move.col
                    )
                }
                else if(expiece.piece==="b"){
                    const isSameLeftDiag = Math.abs(expiece.posi.row-row)===Math.abs(expiece.posi.col-col) && ((expiece.posi.row<row && expiece.posi.col<col) || (expiece.posi.row>row && expiece.posi.col>col))
                    const isSameRightDiag = Math.abs(expiece.posi.row-row)===Math.abs(expiece.posi.col-col) && ((expiece.posi.row<row && expiece.posi.col>col) || (expiece.posi.row>row && expiece.posi.col<col))
                    const ifAttacked = expiece.moves.some(
                        (exmove) => exmove.row === move.row && exmove.col === move.col
                    )
                    if(ifAttacked && isSameLeftDiag){
                        if(expiece.posi.row<row && expiece.posi.col<col) removeMoves.push({row:row+1,col:col+1})
                        else removeMoves.push({row:row-1,col:col-1})
                    }
                    if(ifAttacked && isSameRightDiag){
                        if(expiece.posi.row<row && expiece.posi.col>col) removeMoves.push({row:row+1,col:col-1})
                        else removeMoves.push({row:row-1,col:col+1})
                    }
                    return expiece.moves.some(
                        (exmove) => exmove.row === move.row && exmove.col === move.col
                    )
                }
                else if(expiece.piece==="q"){
                    const isSameRow = expiece.posi.row===row
                    const isSameCol = expiece.posi.col===col
                    const ifAttacked = expiece.moves.some(
                        (exmove) => exmove.row === move.row && exmove.col === move.col
                    )
                    if(ifAttacked && isSameRow){
                        if(col<expiece.posi.col) removeMoves.push({row:row,col:col-1})
                        else removeMoves.push({row:row,col:col+1})
                    }
                    if(ifAttacked && isSameCol){
                        if(expiece.posi.row<row) removeMoves.push({row:row+1,col:col})
                        else removeMoves.push({row:row-1,col:col})
                    }

                    const isSameLeftDiag = Math.abs(expiece.posi.row-row)===Math.abs(expiece.posi.col-col) && ((expiece.posi.row<row && expiece.posi.col<col) || (expiece.posi.row>row && expiece.posi.col>col))
                    const isSameRightDiag = Math.abs(expiece.posi.row-row)===Math.abs(expiece.posi.col-col) && ((expiece.posi.row<row && expiece.posi.col>col) || (expiece.posi.row>row && expiece.posi.col<col))
                    
                    if(ifAttacked && isSameLeftDiag){
                        if(expiece.posi.row<row && expiece.posi.col<col) removeMoves.push({row:row+1,col:col+1})
                        else removeMoves.push({row:row-1,col:col-1})
                    }
                    if(ifAttacked && isSameRightDiag){
                        if(expiece.posi.row<row && expiece.posi.col>col) removeMoves.push({row:row+1,col:col-1})
                        else removeMoves.push({row:row-1,col:col+1})
                    }
                    return expiece.moves.some(
                        (exmove) => exmove.row === move.row && exmove.col === move.col
                    )
                }
                else {
                    return expiece.moves.some(
                        (exmove) => exmove.row === move.row && exmove.col === move.col
                    )
                }
            })
        })
        
        const newFilteredMovesArray = filteredMovesArray.filter((move)=>{return !(removeMoves.some((rMove)=>rMove.row===move.row && rMove.col===move.col))})
        return newFilteredMovesArray
    }


    //WHITE KING MOVES 
    const findMovesForK= (row:number, col:number) => {
        const movesArray:{row:number,col:number}[] = []
        const protectedArray:{row:number,col:number}[] = []
        if(row-1>=0 && (board[row-1][col]===" " || blackPieces.includes(board[row-1][col]))) movesArray.push({row:row-1,col:col})
        if(row+1<8 && (board[row+1][col]===" " || blackPieces.includes(board[row+1][col]))) movesArray.push({row:row+1,col:col})
        if(col-1>=0 && (board[row][col-1]===" " || blackPieces.includes(board[row][col-1]))) movesArray.push({row:row,col:col-1})
        if(col+1<8 && (board[row][col+1]===" " || blackPieces.includes(board[row][col+1]))) movesArray.push({row:row,col:col+1})

        if(row-1>=0 && (whitePieces.includes(board[row-1][col]))) protectedArray.push({row:row-1,col:col})
        if(row+1<8 && (whitePieces.includes(board[row+1][col]))) protectedArray.push({row:row+1,col:col})
        if(col-1>=0 && (whitePieces.includes(board[row][col-1]))) protectedArray.push({row:row,col:col-1})
        if(col+1<8 && (whitePieces.includes(board[row][col+1]))) protectedArray.push({row:row,col:col+1})

        if(row-1>=0 && col-1>=0 && (board[row-1][col-1]===" " || blackPieces.includes(board[row-1][col-1]))) movesArray.push({row:row-1,col:col-1})
        if(row-1>=0 && col+1<8 && (board[row-1][col+1]===" " || blackPieces.includes(board[row-1][col+1]))) movesArray.push({row:row-1,col:col+1})
        if(row+1<8 && col-1>=0 && (board[row+1][col-1]===" " || blackPieces.includes(board[row+1][col-1]))) movesArray.push({row:row+1,col:col-1})
        if(row+1<8 && col+1<8 && (board[row+1][col+1]===" " || blackPieces.includes(board[row+1][col+1]))) movesArray.push({row:row+1,col:col+1})

        if(row-1>=0 && col-1>=0 && (whitePieces.includes(board[row-1][col-1]))) protectedArray.push({row:row-1,col:col-1})
        if(row-1>=0 && col+1<8 && (whitePieces.includes(board[row-1][col+1]))) protectedArray.push({row:row-1,col:col+1})
        if(row+1<8 && col-1>=0 && (whitePieces.includes(board[row+1][col-1]))) protectedArray.push({row:row+1,col:col-1})
        if(row+1<8 && col+1<8 && (whitePieces.includes(board[row+1][col+1]))) protectedArray.push({row:row+1,col:col+1})
        
        if(pieceColour===1 && row===7 && col===4 && board[7][0]==="R" && whiteKingCastlePossible && whiteRookCastlePossible.left && !findThreatToWhiteKing(allPossibleMovesForBlack,board) && !checkMiddleSquaresAttacked("white","left")) movesArray.push({row:row,col:col-2})
        if(pieceColour===1 && row===7 && col===4 && board[7][7]==="R" && whiteKingCastlePossible && whiteRookCastlePossible.right && !findThreatToWhiteKing(allPossibleMovesForBlack,board) && !checkMiddleSquaresAttacked("white","right")) movesArray.push({row:row,col:col+2})
        if(pieceColour===0 && row===0 && col===3 && board[0][0]==="R" && whiteKingCastlePossible && whiteRookCastlePossible.left && !findThreatToWhiteKing(allPossibleMovesForBlack,board) && !checkMiddleSquaresAttacked("white","left")) movesArray.push({row:row,col:col-2})
        if(pieceColour===0 && row===0 && col===3 && board[0][7]==="R" && whiteKingCastlePossible && whiteRookCastlePossible.right && !findThreatToWhiteKing(allPossibleMovesForBlack,board) && !checkMiddleSquaresAttacked("white","right")) movesArray.push({row:row,col:col+2})

        if(moves%2!==0){
            setAllPossibleMovesForWhite((prev)=>{return [...prev,{piece:"K",posi:{row:row,col:col},moves:movesArray, protected:protectedArray}]})
        }
        else{
            const filteredMovesArray = filterMovesForWhiteKing(row,col,movesArray)
            const newFilteredMovesArray1 = filteredMovesArray.filter((move)=>(!allPossibleMovesForBlack.some((piece)=>piece.protected.some((m)=>m.row===move.row && m.col===move.col))))
            let blackKingRow=0, blackKingCol=0
            board.forEach((r,i)=>{
                r.forEach((c,j)=>{
                    if(c==="k"){
                        blackKingRow=i
                        blackKingCol=j
                    }
                })
            })
            let arr:{row:number,col:number}[] = []
            if(blackKingCol-1>=0) arr.push({row:blackKingRow,col:blackKingCol-1})
            if(blackKingCol+1<8) arr.push({row:blackKingRow,col:blackKingCol+1})
            if(blackKingRow-1>=0) arr.push({row:blackKingRow-1,col:blackKingCol})
            if(blackKingRow+1<8) arr.push({row:blackKingRow+1,col:blackKingCol})
            if(blackKingRow-1>=0 && blackKingCol-1>=0) arr.push({row:blackKingRow-1,col:blackKingCol-1})
            if(blackKingRow+1<8 && blackKingCol-1>=0) arr.push({row:blackKingRow+1,col:blackKingCol-1})
            if(blackKingRow-1>=0 && blackKingCol+1<8) arr.push({row:blackKingRow-1,col:blackKingCol+1})
            if(blackKingRow+1<8 && blackKingCol+1<8) arr.push({row:blackKingRow+1,col:blackKingCol+1})
            
            const newFilteredMovesArray = newFilteredMovesArray1.filter((move)=>(!arr.some((piece)=>piece.row===move.row && piece.col===move.col)))

            if(newFilteredMovesArray.length>0){
                if(allPossibleMovesForWhite.some((piece)=>piece.piece==="K")){
                    setAllPossibleMovesForWhite((prev)=>{return prev.map((piece) => { return piece.piece === "K" ? { piece: "K", posi: { row: row, col: col }, moves: newFilteredMovesArray, protected:protectedArray } : piece })})
                }
                else{
                    setAllPossibleMovesForWhite((prev)=>{return [...prev,{piece:"K",posi:{row:row,col:col},moves:newFilteredMovesArray, protected:protectedArray}]})
                }
            }
            else{
                if(allPossibleMovesForWhite.some((piece)=>piece.piece==="K")){
                    setAllPossibleMovesForWhite((prev)=>{return prev.map((piece) => { return piece.piece === "K" ? { piece: "K", posi: { row: row, col: col }, moves: [], protected:protectedArray } : piece })})
                }
                else{
                    setAllPossibleMovesForWhite((prev)=>{return [...prev,{piece:"K",posi:{row:row,col:col},moves:[], protected:protectedArray}]})
                }
            }
        }
    }

    const filterMovesForBlackKing = (row:number, col:number, movesArray: { row: number; col: number }[]) => {
        const removeMoves:{ row: number, col: number }[] = []
        const filteredMovesArray = movesArray.filter((move) => {
            return !allPossibleMovesForWhite.some((expiece) => {
                if (expiece.piece === "P") {
                    if (pieceColour === 1) {
                        return (
                            (expiece.posi.row - 1 === move.row && expiece.posi.col + 1 === move.col) ||
                            (expiece.posi.row - 1 === move.row && expiece.posi.col - 1 === move.col)
                        )
                    } else {
                        return (
                            (expiece.posi.row + 1 === move.row && expiece.posi.col + 1 === move.col) ||
                            (expiece.posi.row + 1 === move.row && expiece.posi.col - 1 === move.col)
                        )
                    }
                } 
                else if(expiece.piece==="R"){
                    const isSameRow = expiece.posi.row===row
                    const isSameCol = expiece.posi.col===col
                    const ifAttacked = expiece.moves.some(
                        (exmove) => exmove.row === move.row && exmove.col === move.col
                    )
                    if(ifAttacked && isSameRow){
                        if(col<expiece.posi.col) removeMoves.push({row:row,col:col-1})
                        else removeMoves.push({row:row,col:col+1})
                    }
                    if(ifAttacked && isSameCol){
                        if(expiece.posi.row<row) removeMoves.push({row:row+1,col:col})
                        else removeMoves.push({row:row-1,col:col})
                    }
                    return expiece.moves.some(
                        (exmove) => exmove.row === move.row && exmove.col === move.col
                    )
                }
                else if(expiece.piece==="B"){
                    const isSameLeftDiag = Math.abs(expiece.posi.row-row)===Math.abs(expiece.posi.col-col) && ((expiece.posi.row<row && expiece.posi.col<col) || (expiece.posi.row>row && expiece.posi.col>col))
                    const isSameRightDiag = Math.abs(expiece.posi.row-row)===Math.abs(expiece.posi.col-col) && ((expiece.posi.row<row && expiece.posi.col>col) || (expiece.posi.row>row && expiece.posi.col<col))
                    const ifAttacked = expiece.moves.some(
                        (exmove) => exmove.row === move.row && exmove.col === move.col
                    )
                    if(ifAttacked && isSameLeftDiag){
                        if(expiece.posi.row<row && expiece.posi.col<col) removeMoves.push({row:row+1,col:col+1})
                        else removeMoves.push({row:row-1,col:col-1})
                    }
                    if(ifAttacked && isSameRightDiag){
                        if(expiece.posi.row<row && expiece.posi.col>col) removeMoves.push({row:row+1,col:col-1})
                        else removeMoves.push({row:row-1,col:col+1})
                    }
                    return expiece.moves.some(
                        (exmove) => exmove.row === move.row && exmove.col === move.col
                    )
                }
                else if(expiece.piece==="Q"){
                    const isSameRow = expiece.posi.row===row
                    const isSameCol = expiece.posi.col===col
                    const ifAttacked = expiece.moves.some(
                        (exmove) => exmove.row === move.row && exmove.col === move.col
                    )
                    if(ifAttacked && isSameRow){
                        if(col<expiece.posi.col) removeMoves.push({row:row,col:col-1})
                        else removeMoves.push({row:row,col:col+1})
                    }
                    if(ifAttacked && isSameCol){
                        if(expiece.posi.row<row) removeMoves.push({row:row+1,col:col})
                        else removeMoves.push({row:row-1,col:col})
                    }

                    const isSameLeftDiag = Math.abs(expiece.posi.row-row)===Math.abs(expiece.posi.col-col) && ((expiece.posi.row<row && expiece.posi.col<col) || (expiece.posi.row>row && expiece.posi.col>col))
                    const isSameRightDiag = Math.abs(expiece.posi.row-row)===Math.abs(expiece.posi.col-col) && ((expiece.posi.row<row && expiece.posi.col>col) || (expiece.posi.row>row && expiece.posi.col<col))
                    
                    if(ifAttacked && isSameLeftDiag){
                        if(expiece.posi.row<row && expiece.posi.col<col) removeMoves.push({row:row+1,col:col+1})
                        else removeMoves.push({row:row-1,col:col-1})
                    }
                    if(ifAttacked && isSameRightDiag){
                        if(expiece.posi.row<row && expiece.posi.col>col) removeMoves.push({row:row+1,col:col-1})
                        else removeMoves.push({row:row-1,col:col+1})
                    }
                    return expiece.moves.some(
                        (exmove) => exmove.row === move.row && exmove.col === move.col
                    )
                }
                else if(expiece.piece==="K"){
                    let arr:{row:number,col:number}[] = []
                    if(expiece.posi.col-1>=0) arr.push({row:expiece.posi.row,col:expiece.posi.col-1})
                    if(expiece.posi.col+1<8) arr.push({row:expiece.posi.row,col:expiece.posi.col+1})
                    if(expiece.posi.row-1>=0) arr.push({row:expiece.posi.row-1,col:expiece.posi.col})
                    if(expiece.posi.row+1<8) arr.push({row:expiece.posi.row+1,col:expiece.posi.col})
                    if(expiece.posi.col-1>=0 && expiece.posi.row-1>=0) arr.push({row:expiece.posi.row-1,col:expiece.posi.col-1})
                    if(expiece.posi.row+1<8 && expiece.posi.col-1>=0) arr.push({row:expiece.posi.row+1,col:expiece.posi.col-1})
                    if(expiece.posi.row-1>=0 && expiece.posi.col+1<8) arr.push({row:expiece.posi.row-1,col:expiece.posi.col+1})
                    if(expiece.posi.row+1<8 && expiece.posi.col+1<8) arr.push({row:expiece.posi.row+1,col:expiece.posi.col+1})
                    return !arr.some(
                        (attack) => attack.row === move.row && attack.col === move.col
                    )
                }
                else {
                    return expiece.moves.some(
                        (exmove) => exmove.row === move.row && exmove.col === move.col
                    )
                }
            })
        })
        const newFilteredMovesArray = filteredMovesArray.filter((move)=>{return !(removeMoves.some((rMove)=>rMove.row===move.row && rMove.col===move.col))})
        return newFilteredMovesArray
    }

    //BLACK KING MOVES 
    const findMovesFork= (row:number, col:number) => {
        const movesArray:{row:number,col:number}[] = []
        const protectedArray:{row:number,col:number}[] = []
        if(row-1>=0 && (board[row-1][col]===" " || whitePieces.includes(board[row-1][col]))) movesArray.push({row:row-1,col:col})
        if(row+1<8 && (board[row+1][col]===" " || whitePieces.includes(board[row+1][col]))) movesArray.push({row:row+1,col:col})
        if(col-1>=0 && (board[row][col-1]===" " || whitePieces.includes(board[row][col-1]))) movesArray.push({row:row,col:col-1})
        if(col+1<8 && (board[row][col+1]===" " || whitePieces.includes(board[row][col+1]))) movesArray.push({row:row,col:col+1})

        if(row-1>=0 && (blackPieces.includes(board[row-1][col]))) protectedArray.push({row:row-1,col:col})
        if(row+1<8 && (blackPieces.includes(board[row+1][col]))) protectedArray.push({row:row+1,col:col})
        if(col-1>=0 && (blackPieces.includes(board[row][col-1]))) protectedArray.push({row:row,col:col-1})
        if(col+1<8 && (blackPieces.includes(board[row][col+1]))) protectedArray.push({row:row,col:col+1})

        if(row-1>=0 && col-1>=0 && (board[row-1][col-1]===" " || whitePieces.includes(board[row-1][col-1]))) movesArray.push({row:row-1,col:col-1})
        if(row-1>=0 && col+1<8 && (board[row-1][col+1]===" " || whitePieces.includes(board[row-1][col+1]))) movesArray.push({row:row-1,col:col+1})
        if(row+1<8 && col-1>=0 && (board[row+1][col-1]===" " || whitePieces.includes(board[row+1][col-1]))) movesArray.push({row:row+1,col:col-1})
        if(row+1<8 && col+1<8 && (board[row+1][col+1]===" " || whitePieces.includes(board[row+1][col+1]))) movesArray.push({row:row+1,col:col+1})
        
        if(row-1>=0 && col-1>=0 && (blackPieces.includes(board[row-1][col-1]))) protectedArray.push({row:row-1,col:col-1})
        if(row-1>=0 && col+1<8 && (blackPieces.includes(board[row-1][col+1]))) protectedArray.push({row:row-1,col:col+1})
        if(row+1<8 && col-1>=0 && (blackPieces.includes(board[row+1][col-1]))) protectedArray.push({row:row+1,col:col-1})
        if(row+1<8 && col+1<8 && (blackPieces.includes(board[row+1][col+1]))) protectedArray.push({row:row+1,col:col+1})
        
        if(pieceColour===1 && row===0 && col===4 && board[0][0]==="r" && blackKingCastlePossible && blackRookCastlePossible.left && !findThreatToBlackKing(allPossibleMovesForWhite,board) && !checkMiddleSquaresAttacked("black","left")) movesArray.push({row:row,col:col-2})
        if(pieceColour===1 && row===0 && col===4 && board[0][7]==="r" && blackKingCastlePossible && blackRookCastlePossible.right && !findThreatToBlackKing(allPossibleMovesForWhite,board) && !checkMiddleSquaresAttacked("black","right")) movesArray.push({row:row,col:col+2})
        if(pieceColour===0 && row===7 && col===3 && board[7][0]==="r" && blackKingCastlePossible && blackRookCastlePossible.left && !findThreatToBlackKing(allPossibleMovesForWhite,board) && !checkMiddleSquaresAttacked("black","left")) movesArray.push({row:row,col:col-2})
        if(pieceColour===0 && row===7 && col===3 && board[7][7]==="r" && blackKingCastlePossible && blackRookCastlePossible.right && !findThreatToBlackKing(allPossibleMovesForWhite,board) && !checkMiddleSquaresAttacked("black","right")) movesArray.push({row:row,col:col+2})

        if(moves%2===0){
            setAllPossibleMovesForBlack((prev)=>{return [...prev,{piece:"k",posi:{row:row,col:col},moves:movesArray, protected:protectedArray}]})
        }
        else{
            const filteredMovesArray = filterMovesForBlackKing(row,col,movesArray)
            const newFilteredMovesArray1 = filteredMovesArray.filter((move)=>(!allPossibleMovesForWhite.some((piece)=>piece.protected.some((m)=>m.row===move.row && m.col===move.col))))
            let whiteKingRow=0, whiteKingCol=0
            board.forEach((r,i)=>{
                r.forEach((c,j)=>{
                    if(c==="K"){
                        whiteKingRow=i
                        whiteKingCol=j
                    }
                })
            })
            let arr:{row:number,col:number}[] = []
            if(whiteKingCol-1>=0) arr.push({row:whiteKingRow,col:whiteKingCol-1})
            if(whiteKingCol+1<8) arr.push({row:whiteKingRow,col:whiteKingCol+1})
            if(whiteKingRow-1>=0) arr.push({row:whiteKingRow-1,col:whiteKingCol})
            if(whiteKingRow+1<8) arr.push({row:whiteKingRow+1,col:whiteKingCol})
            if(whiteKingRow-1>=0 && whiteKingCol-1>=0) arr.push({row:whiteKingRow-1,col:whiteKingCol-1})
            if(whiteKingRow+1<8 && whiteKingCol-1>=0) arr.push({row:whiteKingRow+1,col:whiteKingCol-1})
            if(whiteKingRow-1>=0 && whiteKingCol+1<8) arr.push({row:whiteKingRow-1,col:whiteKingCol+1})
            if(whiteKingRow+1<8 && whiteKingCol+1<8) arr.push({row:whiteKingRow+1,col:whiteKingCol+1})
            
            const newFilteredMovesArray = newFilteredMovesArray1.filter((move)=>(!arr.some((piece)=>piece.row===move.row && piece.col===move.col)))

            if(newFilteredMovesArray.length>0){
                if(allPossibleMovesForBlack.some((piece)=>piece.piece==="k")){
                    setAllPossibleMovesForBlack((prev)=>{return prev.map((piece) => { return piece.piece === "k" ? { piece: "k", posi: { row: row, col: col }, moves: newFilteredMovesArray, protected:protectedArray } : piece })})
                }
                else{
                    setAllPossibleMovesForBlack((prev)=>{return [...prev,{piece:"k",posi:{row:row,col:col},moves:newFilteredMovesArray, protected:protectedArray}]})
                }
            }
            else{
                if(allPossibleMovesForBlack.some((piece)=>piece.piece==="k")){
                    setAllPossibleMovesForBlack((prev)=>{return prev.map((piece) => { return piece.piece === "k" ? { piece: "k", posi: { row: row, col: col }, moves: [], protected:protectedArray } : piece })})
                }
                else{
                    setAllPossibleMovesForBlack((prev)=>{return [...prev,{piece:"k",posi:{row:row,col:col},moves:[], protected:protectedArray}]})
                }
            }
        }
    }

    const [whiteComp,setWhiteComp] = useState(false)
    const [blackComp, setBlackComp] = useState(false)

    //Now for each white piece selected find all the moves that are possible
    useEffect(()=>{
        setAllPossibleMovesForWhite([])
        const arr:allPossibleMovesType[] = curWhite.map((key)=>{
            if(key.piece==="P") return findMovesForP(key.row,key.col,true,board)
            if(key.piece==="N") return findMovesForN(key.row,key.col,true,board)
            if(key.piece==="R") return findMovesForR(key.row,key.col,true,board)
            if(key.piece==="B") return findMovesForB(key.row,key.col,true,board)
            if(key.piece==="Q") return findMovesForQ(key.row,key.col,true,board)
            if(key.piece==="K") findMovesForK(key.row,key.col)
        }).filter((move): move is allPossibleMovesType => move !== undefined && move !== null)
        setAllPossibleMovesForWhite(arr)
        setWhiteComp(true)
    },[curWhite])

    //Now for each black piece selected find all the moves that are possible
    useEffect(()=>{
        setAllPossibleMovesForBlack([])
        const arr:allPossibleMovesType[] = curBlack.map((key)=>{
            if(key.piece==="p") return findMovesForp(key.row,key.col,true,board)
            if(key.piece==="n") return findMovesForn(key.row,key.col,true,board)
            if(key.piece==="r") return findMovesForr(key.row,key.col,true,board)
            if(key.piece==="b") return findMovesForb(key.row,key.col,true,board)
            if(key.piece==="q") return findMovesForq(key.row,key.col,true,board)
            if(key.piece==="k") findMovesFork(key.row,key.col)
        }).filter((move): move is allPossibleMovesType => move !== undefined && move !== null)
        setAllPossibleMovesForBlack(arr)
        setBlackComp(true)
    },[curBlack])

    useEffect(()=>{
        if(blackComp && moves%2===0){
            curWhite.some((piece)=>{
                if(piece.piece==="K"){
                    findMovesForK(piece.row,piece.col)
                }
            })
        }
        setBlackComp(false)
    },[pieceColour,moves,blackComp])

    useEffect(()=>{
        if(whiteComp && moves%2!==0){
            curBlack.some((piece)=>{
                if(piece.piece==="k"){
                    findMovesFork(piece.row,piece.col)
                }
            })
        }
        setWhiteComp(false)
    },[pieceColour,moves,whiteComp])

    // Function to select all the white pieces present on the board
    const handleAllWhitePieces = () => {
        setCurWhite([])
        const newCurWhite: { piece: string, row: number, col: number }[] = []
        board.forEach((x, i) => {
            x.forEach((y, j) => {
                if (whitePieces.includes(y)) {
                    newCurWhite.push({ piece: y, row: i, col: j })
                }
            })
        })
        setCurWhite(newCurWhite)
    }

    // Function to select all the black pieces present on the board
    const handleAllBlackPieces = () => {
        setCurBlack([])
        const newCurBlack: { piece: string; row: number; col: number }[] = []
        board.forEach((x, i) => {
            x.forEach((y, j) => {
                if (blackPieces.includes(y)) {
                    newCurBlack.push({ piece: y, row: i, col: j })
                }
            })
        })
        setCurBlack(newCurBlack)
    }

    // Based on the turn, i.e., white/black, calculate the moves in the respective order
    useEffect(() => {
        setAllPossibleMovesForWhite([])
        setAllPossibleMovesForBlack([])
        if(opponent){
            if(moves%2===0){
                // If it is white turn, handle black pieces first, then white
                handleAllBlackPieces()
                handleAllWhitePieces()
            } 
            else{
                // If it is black turn, handle white pieces first, then black
                handleAllWhitePieces()
                handleAllBlackPieces()
            }
        }
        else{
            if((pieceColour===1 && moves%2===0) || (pieceColour===0 && moves%2!==0)) {
                // If it is white turn, handle black pieces first, then 
                handleAllBlackPieces()
                handleAllWhitePieces()
            } 
            else{
                // If it is black turn, handle white pieces first, then black
                handleAllWhitePieces()
                handleAllBlackPieces()
            }
        }
    },[moves])

    const themeArray = [
        { l: "#A3B18C", d: "#4A4A4A", s: "#1C1C1C"},   // My Choice
        { l: "#E1B6F4", d: "#8A2BE2", s: "#9C4A94" },  // Light Lavender and Deep Purple
        { l: "#E0C09F", d: "#7A5C47", s: "#A8D1E7" },  // Classic Wood Style
        { l: "#A9C8D8", d: "#2A3E59", s: "#6EC1E4" },  // Elegant Blue Theme
        { l: "#D1D1D1", d: "#4B4B4B", s: "#F8C470" },  // Classic Black and White
        { l: "#A1D3A1", d: "#4C6B2F", s: "#2A4D31" },  // Natural Green Theme
        { l: "#F5A7B8", d: "#E63946", s: "#FF6F61" },  // Soft Pink and Red with Coral
    ]

    const getSizeLogo = () =>{
        return windowSize<640 ? 24 : windowSize<768 ? 26 : windowSize<1024 ? 30 : windowSize<1128 ? 32 : windowSize<1440 ? 34 : windowSize<1800 ? 36 : 36
    }


    return(
        <main className="h-screen w-screen relative flex justify-center items-center overflow-hidden">
            <audio ref={audioRefCastle} src="/sounds/castling.mp3" />
            <audio ref={audioRefCapture} src="/sounds/capture.mp3" />
            <audio ref={audioRefMove} src="/sounds/move.mp3" />
            <audio ref={audioRefCheck} src="/sounds/check.mp3" />
            <audio ref={audioRefGameOverCheckMate} src="/sounds/gameovercheckmate.mp3" />
            <audio ref={audioRefGameOverStaleMate} src="/sounds/gameoverstalemate.mp3" />
            <div className="flex flex-col justify-center items-end p-2">
                <div className="flex justify-center items-center gap-3 mb-1">
                    {whitePlayerTime!==null && blackPlayerTime!==null && increment!==null && <div key="sw-1" className={`${pieceColour===1 ? `${moves%2!==0 ? "bg-black" : "bg-gray-600"} text-white` : "bg-white text-black"} flex justify-center items-center font-bold font-technology text-base md:text-xl p-1 rounded-md gap-2 transform scale-y-[-1] scale-x-[-1]`} style={{border: `2px solid ${themeArray[theme].s}`}}>
                        {(pieceColour===1) ? (
                            <div className="w-30 md:w-24">
                                {blackPlayerTime < 60 ? (
                                    `00 : 00 : ${blackPlayerTime < 10 ? `0${blackPlayerTime}` : blackPlayerTime}`
                                ) : blackPlayerTime < 3600 ? (
                                    `00 : ${Math.floor(blackPlayerTime / 60) < 10 ? `0${Math.floor(blackPlayerTime / 60)}` : Math.floor(blackPlayerTime / 60)} : ${blackPlayerTime % 60 < 10 ? `0${blackPlayerTime % 60}` : blackPlayerTime % 60}`
                                ) : (
                                    `${Math.floor(blackPlayerTime / 3600)} : ${Math.floor((blackPlayerTime / 60) % 60) < 10 ? `0${Math.floor((blackPlayerTime / 60) % 60)}` : Math.floor((blackPlayerTime / 60) % 60)} : ${blackPlayerTime % 60 < 10 ? `0${blackPlayerTime % 60}` : blackPlayerTime % 60}`
                                )}
                            </div>
                        ) : (
                            <div className="w-30 md:w-24">
                                {whitePlayerTime < 60 ? (
                                    `00 : 00 : ${whitePlayerTime < 10 ? `0${whitePlayerTime}` : whitePlayerTime}`
                                ) : whitePlayerTime < 3600 ? (
                                    `00 : ${Math.floor(whitePlayerTime / 60) < 10 ? `0${Math.floor(whitePlayerTime / 60)}` : Math.floor(whitePlayerTime / 60)} : ${whitePlayerTime % 60 < 10 ? `0${whitePlayerTime % 60}` : whitePlayerTime % 60}`
                                ) : (
                                    `${Math.floor(whitePlayerTime / 3600)} : ${Math.floor((whitePlayerTime / 60) % 60) < 10 ? `0${Math.floor((whitePlayerTime / 60) % 60)}` : Math.floor((whitePlayerTime / 60) % 60)} : ${whitePlayerTime % 60 < 10 ? `0${whitePlayerTime % 60}` : whitePlayerTime % 60}`
                                )}
                            </div>
                        )}
                        <div className="w-5">{((pieceColour===1 && moves%2!==0 || (pieceColour===0 && moves%2===0))) && <FaStopwatch color={`${moves%2!==0 ? "white" : "black"}`} />}</div>
                    </div>}
                </div>
                {opponent && 
                    <div className="flex mr-auto">
                        <div><FaUser size={getSizeLogo()} color="#4b5563" className="border-2 border-gray-400 bg-gray-400 p-0.5 md:p-1 mr-2 md:mr-5"/></div>
                        <div className="flex md:-ml-3 text-xs md:text-base font-bold font-anticDidone">{opponent.oppoUname}</div>
                    </div>
                }
                <div className="relative rounded-md my-2 md:my-3" style={{border:`${windowSize >= 768 ? "12px" : "6px"} solid ${themeArray[theme].s}`}}>
                    {pawnToLastSquarePosi.piece!==null ? 
                    <div className="absolute inset-0 flex bg-white justify-center items-center bg-opacity-60 z-20">
                        <div className="flex flex-col justify-center items-center gap-2 lg:gap-3">
                            <div>
                                <div className={`border-2 ${pawnToLastSquarePosi.piece==="P" ? "border-white bg-gray-700" : "border-black bg-slate-400"} p-2 lg:p-3 rounded-md`} onClick={()=>{pawnToLastSquarePosi.piece==="P" ? handlePawnToLastSquare("Q") : handlePawnToLastSquare("q")}}>{pawnToLastSquarePosi.piece==="P" ? <ChessPiece col="Q"/> : <ChessPiece col="q"/>}</div>
                            </div>
                            <div className="flex gap-2">
                                <div className={`border-2 ${pawnToLastSquarePosi.piece==="P" ? "border-white bg-gray-700" : "border-black bg-slate-400"} p-2 lg:p-3 rounded-md`} onClick={()=>{pawnToLastSquarePosi.piece==="P" ? handlePawnToLastSquare("R") : handlePawnToLastSquare("r")}}>{pawnToLastSquarePosi.piece==="P" ? <ChessPiece col="R"/> : <ChessPiece col="r"/>}</div>
                                <div className={`border-2 ${pawnToLastSquarePosi.piece==="P" ? "border-white bg-gray-700" : "border-black bg-slate-400"} p-2 lg:p-3 rounded-md`} onClick={()=>{pawnToLastSquarePosi.piece==="P" ? handlePawnToLastSquare("N") : handlePawnToLastSquare("n")}}>{pawnToLastSquarePosi.piece==="P" ? <ChessPiece col="N"/> : <ChessPiece col="n"/>}</div>
                                <div className={`border-2 ${pawnToLastSquarePosi.piece==="P" ? "border-white bg-gray-700" : "border-black bg-slate-400"} p-2 lg:p-3 rounded-md`} onClick={()=>{pawnToLastSquarePosi.piece==="P" ? handlePawnToLastSquare("B") : handlePawnToLastSquare("b")}}>{pawnToLastSquarePosi.piece==="P" ? <ChessPiece col="B"/> : <ChessPiece col="b"/>}</div>
                            </div>
                        </div>
                    </div> : ""
                    }
                    <div className={`${pauseTheBoard ? "pointer-events-none" : ""} z-10`}>
                        {board.map((row,i)=>(
                            <div key={i} className="flex justify-center">
                                {row.map((col,j)=>(
                                    <div key={i+""+j} style={{background:(i+j)%2==0 ? themeArray[theme].l : themeArray[theme].d}}>
                                    <div key={i+""+j} className="relative flex h-12 w-12 sm:h-9 sm:w-9 md:h-12 md:w-12 lg:h-12 lg:w-12 xl:h-14 xl:w-14 xxl:h-16 xxl:w-16 justify-center items-center" 
                                    style={{
                                        backgroundColor:
                                        isSelected && selectedPiece.row === i && selectedPiece.col === j
                                            ? themeArray[theme].s
                                            : isSelected &&
                                            possibleMovesForSelectedPiece.some(
                                                (move) => move.row === i && move.col === j
                                            )
                                            ? (i + j) % 2 === 0
                                            ? themeArray[theme].l
                                            : themeArray[theme].d
                                            : allMoves.length > 0 &&
                                            ((i === allMoves[allMoves.length - 1].fromRow &&
                                                j === allMoves[allMoves.length - 1].fromCol) ||
                                                (i === allMoves[allMoves.length - 1].toRow &&
                                                j === allMoves[allMoves.length - 1].toCol))
                                            ? "#fcd34d"
                                            : (i + j) % 2 === 0
                                            ? themeArray[theme].l
                                            : themeArray[theme].d,
                                        border:
                                        isSelected &&
                                        possibleMovesForSelectedPiece.some(
                                            (move) => move.row === i && move.col === j
                                        )
                                            ? `4px solid ${themeArray[theme].s}`
                                            : "none",
                                        borderRadius: 
                                        isSelected &&
                                        possibleMovesForSelectedPiece.some(
                                            (move) => move.row === i && move.col === j
                                        ) ? "9999px" : "0px",
                                        boxSizing: "border-box",
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                    }}
                                        onClick={()=>handleSelectedPiece(col,i,j)}
                                    >
                                        {j === 0 && (
                                            <div className="absolute top-0 left-0.5 lg:left-1 text-xxs lg:text-xs" style={{color:(i+j)%2===0 ? `${themeArray[theme].d}` : `${themeArray[theme].l}`}}>{pieceColour===1 ? 8 - i : i + 1}</div>
                                        )}
                                        <ChessPiece col={col} />
                                        {i === 7 && (
                                            <div className="absolute bottom-0 right-0.5 lg:right-1 text-xxs lg:text-xs" style={{color:(i+j)%2===0 ? `${themeArray[theme].d}` : `${themeArray[theme].l}`}}>{pieceColour===1 ? String.fromCharCode(97 + j) : String.fromCharCode(104 - j)}</div>
                                        )}
                                    </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
                {opponent && 
                    <div className="flex mr-auto">
                        <div><FaUser size={getSizeLogo()} color="#4b5563" className="border-2 border-gray-400 bg-gray-400 p-0.5 md:p-1 mr-2 md:mr-5"/></div>
                        <div className="flex md:-ml-3 text-xs md:text-base font-bold font-anticDidone">{user?.google?.name}</div>
                    </div>
                }
                <div className="flex justify-center items-center gap-3 mt-1">
                    {whitePlayerTime!==null && blackPlayerTime!==null && increment!==null && <div key="sw-2" className={`${pieceColour===1 ? `${moves%2===0 ? "bg-white" : "bg-slate-500"} text-black` : "bg-black text-white"} flex justify-end items-center font-bold font-technology text-base md:text-xl p-1 rounded-md gap-2`} style={{border: `2px solid ${themeArray[theme].s}`}}>
                        <div className="w-5">{((pieceColour===1 && moves%2===0 || (pieceColour===0 && moves%2!==0))) && <FaStopwatch color={`${moves%2===0 ? "black" : "white"}`} />}</div>
                        {(pieceColour===1) ? (
                            <div className="w-30 md:w-24">
                                {whitePlayerTime < 60 ? (
                                    `00 : 00 : ${whitePlayerTime < 10 ? `0${whitePlayerTime}` : whitePlayerTime}`
                                ) : whitePlayerTime < 3600 ? (
                                    `00 : ${Math.floor(whitePlayerTime / 60) < 10 ? `0${Math.floor(whitePlayerTime / 60)}` : Math.floor(whitePlayerTime / 60)} : ${whitePlayerTime % 60 < 10 ? `0${whitePlayerTime % 60}` : whitePlayerTime % 60}`
                                ) : (
                                    `${Math.floor(whitePlayerTime / 3600)} : ${Math.floor((whitePlayerTime / 60) % 60) < 10 ? `0${Math.floor((whitePlayerTime / 60) % 60)}` : Math.floor((whitePlayerTime / 60) % 60)} : ${whitePlayerTime % 60 < 10 ? `0${whitePlayerTime % 60}` : whitePlayerTime % 60}`
                                )}
                            </div>
                        ) : (
                            <div className="w-30 md:w-24">
                                {blackPlayerTime < 60 ? (
                                    `00 : 00 : ${blackPlayerTime < 10 ? `0${blackPlayerTime}` : blackPlayerTime}`
                                ) : blackPlayerTime < 3600 ? (
                                    `00 : ${Math.floor(blackPlayerTime / 60) < 10 ? `0${Math.floor(blackPlayerTime / 60)}` : Math.floor(blackPlayerTime / 60)} : ${blackPlayerTime % 60 < 10 ? `0${blackPlayerTime % 60}` : blackPlayerTime % 60}`
                                ) : (
                                    `${Math.floor(blackPlayerTime / 3600)} : ${Math.floor((blackPlayerTime / 60) % 60) < 10 ? `0${Math.floor((blackPlayerTime / 60) % 60)}` : Math.floor((blackPlayerTime / 60) % 60)} : ${blackPlayerTime % 60 < 10 ? `0${blackPlayerTime % 60}` : blackPlayerTime % 60}`
                                )}
                            </div>
                        )}
                    </div>}
                </div>
            </div>
            {(draw || whiteWon || blackWon || staleMateWhiteWon || staleMateBlackWon) &&
                <div className="absolute flex flex-col bg-white h-[35%] w-[55%] md:h-[40%] md:w-[35%] lg:h-[45%] lg:w-[25%] rounded-lg" style={{border: `4px solid ${themeArray[theme].s}`}}>
                    <div className="flex flex-col items-end mt-2 mr-2 md:mt-3 md:mr-3 lg:mt-4 lg:mr-4"><button onClick={()=>setPauseTheBoard(true)}><FaWindowClose color="#3b82f6" size={iconSize}/></button></div>
                    <div className="flex flex-col gap-4 lg:gap-6 justify-center items-center mt-4 lg:mt-6">
                        <div className="text-base md:text-lg lg:text-3xl font-extrabold text-center" style={{color: themeArray[theme].s}}>{draw ? "DRAW!!" : (staleMateWhiteWon || staleMateBlackWon) ? "DRAW BY STALEMATE" : whiteWon ? <div className="flex flex-col"><div>{opponent ? pieceColour===1 ? "VICTORY" : "DEFEAT" : "VICTORY"}</div><div>WHITE WON</div></div> : blackWon ? <div className="flex flex-col"><div>{opponent ? pieceColour===0 ? "VICTORY" : "DEFEAT" : "VICTORY"}</div><div>BLACK WON</div></div> : ""}</div>
                        <button onClick={()=>router.push("/HomePage")} className="text-sm md:text-base lg:text-xl font-extrabold text-black p-1 md:p-2 rounded-lg hover:scale-105" style={{border: `4px solid ${themeArray[theme].s}`}}>GO BACK</button>
                    </div>
                </div>
            }
        </main>
    )
}

export default function GamePage(){
    return(
        <Suspense fallback={<div>Loading...</div>}>
            <HomePageContent />
        </Suspense>
    )
}