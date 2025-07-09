import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import '../styles/main.css';
const URL = process.env.REACT_APP_BACKENDURL ||"http://localhost:5000";
function Repo() {
    const navigate = useNavigate();
    const [repos, setRepos] = useState([]);
    const [loading, setLoading] = useState(true);
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

                const result = await axios.get(`${URL}/github/repo`, {
                    withCredentials: true,
                });

                setRepos(result.data);
            } catch (err) {
                console.error("Auth check failed", err);
                navigate("/login");
            } finally {
                setLoading(false);
            }
        };

        checkAuthAndFetch();
    }, [navigate]);

    const categorized = [
        { title: "Public Repositories", filter: (r) => !r.private },
        { title: "Private Repositories", filter: (r) => r.private },
    ];

    return (
        <div>
            <div className="commit-box"><h1>MyCommits</h1></div>
            <p className="para">Click on the repository to see the commits</p>
            {loading ? (
                <p className="para">Loading repositories...</p>
            ) : repos.length !== 0 ? (
                categorized.map((category) => (
                    <motion.div
                        key={category.title}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="repo-titlebox1"><h2>{category.title}</h2></div>
                        <div className="innerbox">
                            <ul>
                                {repos.filter(category.filter).map((repo, index) => (
                                    <motion.li
                                        key={repo.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <button
                                            onClick={() => navigate(`/commits/${repo.name}`)}
                                            className="repo-link-button"
                                        >
                                            {repo.name}
                                        </button>

                                    </motion.li>
                                ))}
                            </ul>
                        </div>
                    </motion.div>
                ))
            ) : (
                <p className="para">No Repositories found. Make one!</p>
            )}
            <div style={{
                display:"flex",
                flexDirection:"row",
                justifyContent:"center",
                alignItems:"center",
                gap:"20px",
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

export default Repo;
