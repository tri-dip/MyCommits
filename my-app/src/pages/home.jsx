import React from "react";
import '../styles/home.css';
const URL = process.env.REACT_APP_BACKENDURL ||"http://localhost:5000";
function Home(){
    const handleLogin = () => {
        window.location.href = `${URL}/auth/github`; 
      };
    return (
        
        <div className="box">
            <div className="box1"><h1>MyCommits</h1></div>
            <div className="box2">
                <div className="part1">
                    <h2>Know Your Repos</h2>
                    <p>
                    MyCommits lets you connect with GitHub and instantly view your repositories and commit history. Track your work, explore your contributions—all in one place.
                    </p>
                    <button onClick={handleLogin}>Link to Github</button>
                </div>
                <div className="part2">
                    <img src="/github.jpg" alt="github logo" />
                </div>
            </div>
        </div>
    )
}
export default Home;