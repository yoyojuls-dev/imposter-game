import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { getRandomWord } from './wordBank'; // Make sure this matches the filename where you put the words!
import { Room, Player } from './types';

const app = express();
const httpServer = createServer(app);

app.use(cors({ origin: '*' }));
app.use(express.json());

const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

const rooms = new Map<string, Room>();

// Track used words per session ID + topic to avoid repeats within a session
const sessionUsedWords = new Map<string, string[]>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function pickImposter(players: Player[]): string {
  const idx = Math.floor(Math.random() * players.length);
  return players[idx].id;
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/generate', (req, res) => {
  const { topic, difficulty, sessionId } = req.body;
  if (!topic || !difficulty) {
    return res.status(400).json({ error: 'topic and difficulty required' });
  }
  try {
    const key = `${sessionId || 'default'}:${topic}`;
    const usedWords = sessionUsedWords.get(key) || [];
    
    // Pulls from your local data instantly
    const result = getRandomWord(topic, difficulty as 'Easy' | 'Medium' | 'Hard', usedWords);
    
    // Track this word as used for this session+topic
    usedWords.push(result.word);
    sessionUsedWords.set(key, usedWords);
    
    // Clean up old sessions (keep map from growing forever)
    if (sessionUsedWords.size > 1000) {
      const firstKey = sessionUsedWords.keys().next().value;
      if (firstKey) sessionUsedWords.delete(firstKey);
    }
    
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Generation failed' });
  }
});

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('create_room', ({ playerName }: { playerName: string }) => {
    let code = generateRoomCode();
    while (rooms.has(code)) code = generateRoomCode();

    const player: Player = { id: socket.id, name: playerName, isReady: false };
    const room: Room = {
      code,
      host: socket.id,
      players: [player],
      state: 'lobby',
      topic: '',
      difficulty: 'Medium',
      word: '',
      hint: '',
      imposterId: '',
      usedWords: [],
    };

    rooms.set(code, room);
    socket.join(code);
    socket.emit('room_joined', { room, playerId: socket.id });
    console.log(`Room ${code} created by ${playerName}`);
  });

  socket.on('join_room', ({ roomCode, playerName }: { roomCode: string; playerName: string }) => {
    const room = rooms.get(roomCode.toUpperCase());
    if (!room) { socket.emit('error', { message: 'Room not found' }); return; }
    if (room.state !== 'lobby') { socket.emit('error', { message: 'Game already in progress' }); return; }
    if (room.players.length >= 10) { socket.emit('error', { message: 'Room is full' }); return; }

    const player: Player = { id: socket.id, name: playerName, isReady: false };
    room.players.push(player);
    socket.join(roomCode.toUpperCase());

    socket.emit('room_joined', { room, playerId: socket.id });
    io.to(roomCode.toUpperCase()).emit('room_updated', { room });
    console.log(`${playerName} joined room ${roomCode}`);
  });

  socket.on('update_settings', ({ roomCode, topic, difficulty }: { roomCode: string; topic: string; difficulty: string }) => {
    const room = rooms.get(roomCode);
    if (!room || room.host !== socket.id) return;
    room.topic = topic;
    room.difficulty = difficulty;
    io.to(roomCode).emit('room_updated', { room });
  });

  socket.on('start_game', ({ roomCode }: { roomCode: string }) => {
    const room = rooms.get(roomCode);
    if (!room || room.host !== socket.id) return;
    if (room.players.length < 3) { socket.emit('error', { message: 'Need at least 3 players' }); return; }
    if (!room.topic) { socket.emit('error', { message: 'Please select a topic' }); return; }

    try {
      // Synchronously grab a word and hint from your local bank
      const { word, hint } = getRandomWord(
        room.topic, 
        room.difficulty as 'Easy' | 'Medium' | 'Hard', 
        room.usedWords || []
      );
      
      room.word = word;
      room.hint = hint;
      room.imposterId = pickImposter(room.players);
      room.state = 'playing';
      if (!room.usedWords) room.usedWords = [];
      room.usedWords.push(word);

      for (const player of room.players) {
        const playerSocket = io.sockets.sockets.get(player.id);
        if (!playerSocket) continue;
        const isImposter = player.id === room.imposterId;
        playerSocket.emit('game_started', {
          isImposter,
          word: isImposter ? null : word,
          hint: isImposter ? hint : null,
          topic: room.topic,
          players: room.players,
        });
      }

      const publicRoom = { ...room, word: '', hint: '', imposterId: '' };
      io.to(roomCode).emit('room_updated', { room: publicRoom });
      console.log(`Game started in ${roomCode}: word="${word}"`);
    } catch (err) {
      console.error(err);
      socket.emit('error', { message: 'Failed to generate word.' });
    }
  });

  socket.on('reveal_imposter', ({ roomCode }: { roomCode: string }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    io.to(roomCode).emit('imposter_revealed', {
      imposterId: room.imposterId,
      word: room.word,
      players: room.players,
    });
    room.state = 'revealed';
  });

  socket.on('play_again', ({ roomCode }: { roomCode: string }) => {
    const room = rooms.get(roomCode);
    if (!room || room.host !== socket.id) return;
    room.state = 'lobby';
    room.word = '';
    room.hint = '';
    room.imposterId = '';
    room.topic = '';
    room.difficulty = 'Medium';
    // Keep usedWords to avoid repeats across rounds
    io.to(roomCode).emit('room_updated', { room });
    io.to(roomCode).emit('reset_game');
  });

  socket.on('disconnecting', () => {
    for (const [code, room] of rooms.entries()) {
      const idx = room.players.findIndex((p) => p.id === socket.id);
      if (idx === -1) continue;
      room.players.splice(idx, 1);
      if (room.players.length === 0) {
        rooms.delete(code);
      } else {
        if (room.host === socket.id) room.host = room.players[0].id;
        io.to(code).emit('room_updated', { room });
        io.to(code).emit('player_left', { playerId: socket.id });
      }
    }
  });
});

const PORT = process.env.PORT || 3001;

// Keep-alive ping to prevent Render free tier spin-down
setInterval(async () => {
  try {
    await fetch(`http://localhost:${PORT}/api/health`)
  } catch {}
}, 14 * 60 * 1000) // ping every 14 minutes

httpServer.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Game server running on port ${PORT}`);
});