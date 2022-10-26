import React from 'react'
import ReactDOM from 'react-dom/client'
import DemoApp from './DemoApp'
import './index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <DemoApp/>
    </React.StrictMode>,
);
