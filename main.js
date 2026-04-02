const { useState, useEffect } = React;

function TahoeApp() {
    const [vms, setVms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("En attente...");

    // 1. Initialisation au chargement du composant
    useEffect(() => {
        loadVMs();
    }, []);

    // 2. Charger la liste des ISO stockés dans l'iPad
    const loadVMs = async () => {
        const db = await idb.openDB('TahoeStorage', 1, {
            upgrade(db) { 
                if (!db.objectStoreNames.contains('files')) {
                    db.createObjectStore('files'); 
                }
            }
        });
        const allKeys = await db.getAllKeys('files');
        setVms(allKeys);
    };

    // 3. Importer l'ISO Tahoe dans le navigateur
    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        setStatus("Importation de l'ISO dans le stockage local...");

        try {
            const db = await idb.openDB('TahoeStorage', 1);
            await db.put('files', file, file.name);
            setStatus("ISO sauvegardé avec succès !");
            loadVMs();
        } catch (err) {
            alert("Erreur de stockage : " + err.message);
        } finally {
            setLoading(false);
        }
    };

    // 4. Lancer la VM macOS 26 (Tahoe)
    const runTahoe = async (name) => {
        setLoading(true);
        setStatus("Initialisation du moteur 64-bit...");

        try {
            const db = await idb.openDB('TahoeStorage', 1);
            const isoBlob = await db.get('files', name);
            
            // Création du disque virtuel à partir du Blob stocké
            const device = await CheerpX.CloudDevice.createFromBlob(isoBlob);
            const canvas = document.getElementById("display");

            setStatus("Démarrage de macOS 26 (Tahoe)...");

            // Lancement du moteur JIT x86_64
            // Note : Tahoe 26 demande un espace d'adressage massif
            await CheerpX.Linux.run({
                device: device,
                mounts: [{ type: "ext2", dev: device, path: "/" }],
                display: canvas,
                addressSpaceSize: 8192, // 8GB de RAM virtuelle pour MacOS 26
                cpu: "x86_64"
            });

        } catch (err) {
            alert("Erreur de lancement : " + err.message);
            setStatus("Échec du boot.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', width: '100%', height: '100%' }}>
            {/* Barre latérale type VirtualBox */}
            <div className="sidebar">
                <h2 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Tahoe VM Manager</h2>
                
                <button 
                    className="btn-add" 
                    onClick={() => document.getElementById('up').click()}
                    disabled={loading}
                >
                    {loading ? "Veuillez patienter..." : "+ Importer Tahoe ISO"}
                </button>
                <input id="up" type="file" onChange={handleUpload} />

                <div style={{ marginTop: '30px' }}>
                    <p style={{ fontSize: '0.8rem', color: '#888' }}>MACHINES ENREGISTRÉES</p>
                    {vms.map(name => (
                        <div key={name} className="vm-card" onClick={() => runTahoe(name)}>
                            <div style={{ fontWeight: 'bold' }}>{name}</div>
                            <div className="status">Prêt (64-bit)</div>
                        </div>
                    ))}
                </div>
                
                <div style={{ marginTop: 'auto', fontSize: '0.7rem', color: '#555' }}>
                    Statut : {status}
                </div>
            </div>

            {/* Zone d'affichage de la VM */}
            <div className="main">
                <canvas id="display"></canvas>
                {!vms.length && !loading && (
                    <div style={{ position: 'absolute', textAlign: 'center' }}>
                        <p>Aucune machine virtuelle trouvée.</p>
                        <p style={{ color: '#555' }}>Importez votre ISO macOS 26 pour commencer.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Rendu de l'application
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<TahoeApp />);
