import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";

const socket = io.connect("/");

function Session() {
  const [peers, setPeers] = useState([]);
  const userStreamRef = useRef();
  const peersRef = useRef([]);

  useEffect(() => {
    const { room } = JSON.parse(localStorage.getItem("session"));

    navigator.mediaDevices
      .getUserMedia({ video: false, audio: true })
      .then((stream) => {
        console.log(stream);
        if (userStreamRef.current) {
          userStreamRef.current.srcObject = stream;
        }

        socket.emit("join room", room);

        // get a list of all users already in a room and create a new peer object for each of them
        // push the id of the user and their peer object into the peersRef, which is used for accepting signals
        // set the list of users in state so that we can render elements on the client
        socket.on("get all users", (userList) => {
          const peerList = [];
          userList.forEach((user) => {
            // in this case, user = socket id of the user already in a room
            const userInRoom = createPeer(user, socket.id);
            peersRef.current.push({
              peerId: user,
              peer: userInRoom,
            });
            peerList.push(userInRoom);
          });
          setPeers(peerList);
        });

        // when a new user joins, anyone already in the room is notified of this and they receive a signal
        // create a newPeer object for the new person in the call and push the new user's id and their peer object into peersRef
        // add the new user to the peers state variable to render them onto the screen
        socket.on("new user joined", ({ callerSignal, callerId }) => {
          const userToAdd = addPeer(callerSignal, callerId);
          peersRef.current.push({
            peerId: callerId,
            peer: userToAdd,
          });
          setPeers((usersInRoom) => [...usersInRoom, userToAdd]);
        });

        // after the users already in the room send their own signal to the person joining
        // go through the process of accepting each of the returned signals
        socket.on(
          "receiving returned signal",
          ({ userInRoomSignal, userInRoomId }) => {
            const item = peersRef.current.find(
              (peer) => peer.peerId === userInRoomId
            );
            item.peer.signal(userInRoomSignal);
          }
        );
      })
      .catch((error) => console.error(error));

    // handle disconnecting and removing the user from the list of people in the room
    // re-rendering the users in a room is still a WIP
    return () => {
      socket.emit("disconnect");
      socket.off();
    };
  }, []);

  // userToSignal = socket id of a user already in a room
  // callerId = socket id of a user joining a room
  // stream = stream object from navigator.mediaDevices.getUserMedia
  function createPeer(userToSignal, callerId, stream) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    // signal to everyone else already in the call
    peer.on("signal", (callerSignal) => {
      socket.emit("sending signal", { userToSignal, callerId, callerSignal });
    });

    return peer;
  }

  // incomingSignal = signal object from user joining a room
  // callerId = socket id of a user joining a room
  // stream = stream object from navigator.mediaDevices.getUserMedia
  function addPeer(incomingSignal, callerId, stream) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    // signal to the new person joining the call
    peer.on("signal", (userInRoomSignal) => {
      socket.emit("returning signal", { userInRoomSignal, callerId });
    });

    // accept the signal of the person joining the call
    peer.signal(incomingSignal);

    return peer;
  }

  return (
    <div>
      <div>
        <img src={thorn} alt="" />
        {/* <audio autoPlay ref={userStreamRef} /> */}
      </div>
      {peers.map((peer, index) => (
        <div key={index}>
          <img src={lumina} alt="" />
          {/* <Audio peer={peer} /> */}
        </div>
      ))}
    </div>
  );
}

// need this component to pass the peer object into
// peer object contains a stream property which is passed into a ref
// ref is then passed into a DOM element
// for video, use: <video muted playsInline autoPlay ref={videoRef} />
// for audio, use: <audio autoPlay ref={audioRef}
const Audio = ({ peer }) => {
  const roomMemberStreamRef = useRef();

  useEffect(() => {
    peer.on("stream", (stream) => {
      roomMemberStreamRef.current.srcObject = stream;
    });
  }, [peer]);

  return <audio autoPlay ref={roomMemberStreamRef} />;
};

const thorn =
  "https://www.bungie.net/common/destiny2_content/icons/6481ca96bae1de44456ec24afb4e4881.jpg";

const lumina =
  "https://www.bungie.net/common/destiny2_content/icons/4f1753ea46976f7b89ccd2e4bca2d32b.jpg";

export default Session;
