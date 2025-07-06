import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import "../styles/commit.css";
const URL = "http://localhost:5000";

function Commit() {
    const { repoName } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [commits, setCommit] = useState([]);
    const handleLogout = async () => {
        try {
            await axios.post(`${URL}/logout`, {}, { withCredentials: true });
            navigate("/login");
        } catch (err) {
            console.error("Logout failed", err);
        }
    };
    useEffect(() => {
        const checkAuthAndFetch = async () => {
            try {
                const res = await axios.get(`${URL}/api/check-auth`, {
                    withCredentials: true,
                });

                if (!res.data.authenticated) {
                    navigate("/login");
                    return;
                }

                const result = await axios.get(`${URL}/github/repo/commit/${repoName}`, {
                    withCredentials: true,
                });

                setCommit(result.data);
            } catch (err) {
                console.error("Auth check failed", err);
                navigate("/login");
            } finally {
                setLoading(false);
            }
        };

        checkAuthAndFetch();
    }, [navigate, repoName]);

    return (
        <div>
            <div className="commit"><h1>MyCommits</h1></div>
            <div className="commit-titlebox1"><h2>Commits for {repoName}</h2></div>
            {loading ? (
                <p className="paracommit">Loading Commits...</p>
            ) : (
                <div className="commitul">
                    <ul>
                        {commits.map((commit, index) => (
                            <motion.li
                                key={commit.sha || index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <p><strong>{commit.commit.message}</strong></p>
                                <p>By: {commit.commit.author.name} </p>
                                <p>Date: {new Date(commit.commit.author.date).toLocaleString()}</p>
                            </motion.li>
                        ))}
                    </ul></div>

            )}
            <div style={{
                display:"flex",
                flexDirection:"row",
                justifyContent:"center",
                alignItems:"center",
                gap:"20px",
                margin:"80px",
            }}>
                <div>
                    <button
                        onClick={() => navigate(-1)}
                        style={{
                            padding: "10px 10px",
                            fontSize: "1rem",
                            backgroundColor: "#ffffff",
                            color: "#000000",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            display: "flex",
                            justifyContent: "center",
                            gap: "5px"
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="#"><path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z" /></svg>Previous
                    </button>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", padding: "20px" }}>
                    <button
                        onClick={handleLogout}
                        style={{
                            padding: "10px 20px",
                            fontSize: "1rem",
                            backgroundColor: "#ff4d4d",
                            color: "#fff",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer"
                        }}
                    >
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Commit;
