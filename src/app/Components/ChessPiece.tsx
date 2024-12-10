import { useEffect, useState } from "react"
import { FaChessRook, FaChessKnight, FaChessBishop, FaChessQueen, FaChessKing, FaChessPawn } from "react-icons/fa"
import useWindowSize from './UseWindowSize'

type ChessPieceType = {
    col : string
}
const ChessPiece:React.FC<ChessPieceType> = ({col}) => {

    const windowSize = useWindowSize()

    const getSize = () =>{
        return windowSize<640 ? 28 : windowSize<768 ? 30 : windowSize<1024 ? 28 : windowSize<1128 ? 34 : windowSize<1440 ? 36 : windowSize<1800 ? 40 : 42
    }

    return(
        <div>
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
    )
}

export default ChessPiece