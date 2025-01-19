import React, { useState, useCallback, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess, Square } from 'chess.js';
import { Button, Box, Typography } from '@mui/material';

interface ChessComponentProps {
  onMove?: (move: string) => void;
  initialPosition?: string;
  allowMoves?: boolean;
}

const ChessComponent: React.FC<ChessComponentProps> = ({
  onMove,
  initialPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  allowMoves = true,
}) => {
  // Initialize the chess game
  const [game, setGame] = useState<Chess>(() => {
    try {
      return new Chess(initialPosition);
    } catch (error) {
      console.error('Invalid initial position, using default starting position');
      return new Chess();
    }
  });
  const [moveFrom, setMoveFrom] = useState('');
  const [rightClickedSquares, setRightClickedSquares] = useState<Record<string, any>>({});
  const [moveSquares, setMoveSquares] = useState({});
  const [optionSquares, setOptionSquares] = useState({});

  // Reset the game to initial position
  useEffect(() => {
    try {
      const newGame = new Chess(initialPosition);
      setGame(newGame);
    } catch (error) {
      console.error('Invalid position provided, keeping current position');
    }
  }, [initialPosition]);

  // Handle piece movement
  function getMoveOptions(square: Square) {
    const moves = game.moves({
      square,
      verbose: true
    });
    
    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }

    const newSquares: { [key: string]: { background: string; borderRadius?: string } } = {};
    moves.map((move: { to: string; from: string }) => {
      newSquares[move.to] = {
        background:
          game.get(move.to as Square) &&
          game.get(move.to as Square)?.color !== game.get(square as Square)?.color
            ? 'rgba(255, 0, 0, 0.4)'
            : 'rgba(0, 255, 0, 0.4)',
        borderRadius: '50%'
      };
      return move;
    });
    newSquares[square] = {
      background: 'rgba(255, 255, 0, 0.4)'
    };
    setOptionSquares(newSquares);
    return true;
  }

  // Handle piece drop
  function onDrop(sourceSquare: string, targetSquare: string) {
    if (!allowMoves) return false;

    const move = makeMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q' // always promote to queen for simplicity
    });

    // illegal move
    if (move === null) return false;
    return true;
  }

  // Make a move (can be called programmatically or from the board)
  const makeMove = useCallback(
    (move: { from: string; to: string; promotion?: string }) => {
      try {
        const result = game.move(move);
        if (result === null) return null;
        
        setGame(new Chess(game.fen()));
        setMoveSquares({
          [move.from]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' },
          [move.to]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' }
        });
        setOptionSquares({});
        
        if (onMove) {
          onMove(game.fen());
        }
        
        return result;
      } catch (e) {
        return null;
      }
    },
    [game, onMove]
  );

  // Example of making a programmatic move
  const makeProgrammaticMove = useCallback(
    (moveString: string) => {
      const move = game.move(moveString);
      if (move) {
        setGame(new Chess(game.fen()));
        if (onMove) {
          onMove(game.fen());
        }
      }
      return move !== null;
    },
    [game, onMove]
  );

  // Handle square right click
  function onSquareRightClick(square: string) {
    const colour = 'rgba(0, 0, 255, 0.4)';
    setRightClickedSquares({
      ...rightClickedSquares,
      [square]:
        rightClickedSquares[square]?.backgroundColor === colour
          ? undefined
          : { backgroundColor: colour }
    });
  }

  // Handle square click
  function onSquareClick(square: string) {
    if (!allowMoves) return;

    setRightClickedSquares({});

    // from square
    if (!moveFrom) {
      const hasMoves = getMoveOptions(square as Square);
      if (hasMoves) setMoveFrom(square);
      return;
    }

    // to square
    if (moveFrom) {
      const move = makeMove({
        from: moveFrom,
        to: square,
        promotion: 'q' // always promote to queen for simplicity
      });
      
      // if invalid, setMoveFrom and getMoveOptions
      if (move === null) {
        const hasMoves = getMoveOptions(square as Square);
        if (hasMoves) setMoveFrom(square);
        return;
      }

      setMoveFrom('');
      setOptionSquares({});
      return;
    }
  }

  // Example button to make a programmatic move
  const handleExampleMove = () => {
    // Makes the move e2 to e4 if it's white's turn and legal
    if (game.turn() === 'w') {
      makeProgrammaticMove('e4');
    } else {
      // Makes the move e7 to e5 if it's black's turn and legal
      makeProgrammaticMove('e5');
    }
  };

  return (
    <Box sx={{ maxWidth: 1100, margin: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        {game.isGameOver() 
          ? 'Game Over!' 
          : `Current turn: ${game.turn() === 'w' ? 'White' : 'Black'}`}
      </Typography>
      
      <Chessboard
        position={game.fen()}
        onSquareClick={onSquareClick}
        onSquareRightClick={onSquareRightClick}
        onPieceDrop={onDrop}
        boardWidth={600}
        customBoardStyle={{
          borderRadius: '4px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
        }}
        customSquareStyles={{
          ...moveSquares,
          ...optionSquares,
          ...rightClickedSquares
        }}
      />
      
      <Box sx={{ mt: 2 }}>
        <Button 
          variant="contained" 
          onClick={handleExampleMove}
          disabled={game.isGameOver() || !allowMoves}
        >
          Make Example Move
        </Button>
      </Box>
    </Box>
  );
};

export default ChessComponent;