import React, { useRef, useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('https://vibechat-2-z3lg.onrender.com'); // Replace with your backend URL

const VideoCall = ({ contactId }) => {
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const [peerConnection, setPeerConnection] = useState(null);

    useEffect(() => {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }], // STUN server
        });

        // Add local stream to peer connection
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
                localVideoRef.current.srcObject = stream;
                stream.getTracks().forEach((track) => pc.addTrack(track, stream));
            });

        // Handle remote stream
        pc.ontrack = (event) => {
            remoteVideoRef.current.srcObject = event.streams[0];
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('ice-candidate', {
                    target: contactId,
                    candidate: event.candidate,
                });
            }
        };

        setPeerConnection(pc);

        // Handle incoming signaling messages
        socket.on('offer', async (data) => {
            if (data.sender === contactId) {
                await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit('answer', { sender: contactId, answer });
            }
        });

        socket.on('answer', async (data) => {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        });

        socket.on('ice-candidate', async (data) => {
            if (data.candidate) {
                await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
        });

        return () => pc.close();
    }, [contactId]);

    const startCall = async () => {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit('offer', { target: contactId, offer });
    };

    return (
        <div>
            <div>
                <video ref={localVideoRef} autoPlay muted></video>
                <video ref={remoteVideoRef} autoPlay></video>
            </div>
            <button onClick={startCall}>Start Video Call</button>
        </div>
    );
};

export default VideoCall;
