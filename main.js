const { useState, useEffect } = React;

function App() {
    const [vmList, setVmList] = useState([]);
    const [isRunning, setIsRunning] = useState(false);

    // Initialisation du stockage iPad
    const getDB = async () => {
        return await idb.openDB('CloudBox', 1, {
            upgrade(db) { db.createObjectStore('vms'); }
        });
    };

    // Ajouter une VM (Stocke l'ISO dans le navigateur)
    const addVM = async (e) => {
        const file = e.target.files[0];
        const db = await getDB();
        await db.put('vms', file, file.name);
        setVmList([...vmList, file.name]);
        alert("VM ajoutée au stockage local !");
    };

    // Lancer la VM avec CheerpX
    const startVM = async (name) => {
        setIsRunning(true);
        const db = await getDB();
        const isoBlob = await db.get('vms', name);
        
        // Création du disque virtuel
        const device = await CheerpX.CloudDevice.createFromBlob(isoBlob);
        
        // Lancement de l'émulateur 64-bit
        await CheerpX.Linux.run({
            device: device,
            mounts: [{ type: "ext2", dev: device, path: "/" }],
            display: document.getElementById("canvas")
        });
    };

    return (
        <div style={{display:'flex', width:'100%'}}>
            <div className="sidebar">
                <h3>Mes Machines</h3>
                <input type="file" id="upload" hidden onChange={addVM} />
                <button className="btn" onClick={() => document.getElementById('upload').click()}>+ Nouvelle VM</button>
                <hr/>
                {vmList.map(name => (
                    <button key={name} className="btn" onClick={() => startVM(name)}>{name}</button>
                ))}
            </div>
            <div className="main-view">
                <div className="screen-area">
                    <canvas id="canvas"></canvas>
                    {!isRunning && <p>Sélectionnez une machine pour démarrer</p>}
                </div>
            </div>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
