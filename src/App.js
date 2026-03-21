import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import EditorPage from './pages/EditorPage';
import { Toaster } from 'react-hot-toast';

function App() {
    return (
        <>
            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        background: '#1e2128',
                        color: '#c9d1d9',
                        border: '1px solid #2a2d35',
                        fontSize: '13px',
                    },
                    success: { iconTheme: { primary: '#7c6af7', secondary: '#fff' } },
                }}
            />
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/editor/:roomId" element={<EditorPage />} />
                </Routes>
            </BrowserRouter>
        </>
    );
}

export default App;
