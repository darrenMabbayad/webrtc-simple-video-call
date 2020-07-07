import React from "react";
import { Link } from "react-router-dom";
import useForm from "../utils/useForm";

function Join() {
  const [joinInfo, setJoinInfo] = useForm({ room: "" });

  function joinSession() {
    localStorage.setItem("session", JSON.stringify(joinInfo));
  }

  return (
    <div>
      <input
        id="room"
        type="text"
        value={joinInfo.room}
        onChange={setJoinInfo}
        placeholder="Room"
      />
      <Link to="/session">
        <button onClick={joinSession}>Join Session</button>
      </Link>
    </div>
  );
}

export default Join;
