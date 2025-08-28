export function registerChat(io) {
io.on('connection', (socket) => {
console.log('socket connected', socket.id);


socket.on('chat:message', (payload) => {
io.emit('chat:message', { ...payload, at: new Date().toISOString() });
});


socket.on('disconnect', () => {
console.log('socket disconnected', socket.id);
});
});
}