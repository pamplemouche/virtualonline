// DEBUGGER POUR IPAD (Affiche les erreurs en rouge si ça plante)
window.onerror = function(msg, url, line) {
    const errDiv = document.createElement('div');
    errDiv.style = "color:white;background:red;padding:20px;position:fixed;top:0;left:0;z-index:9999;width:100%;font-family:sans-serif";
    errDiv.innerHTML = `<h1>Erreur de script</h1><p>${msg}</p><p>Ligne: ${line}</p>`;
    document.body.appendChild(errDiv);
};

const { useState, useEffect, createElement: h } = React;

function TahoeApp() {
    const [vms, setVms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("Prêt");

    // Charger les VMs au démarrage
    useEffect(() => {
        loadVMs();
        requestPersist();
    }, []);

    const requestPersist = async () => {
        if (navigator.storage && navigator.storage.persist) await navigator.storage.persist();
    };

    const loadVMs = async () => {
        const db = await idb.openDB('TahoeStorage', 1, {
            upgrade(db) { 
                if (!db.objectStoreNames.contains('files')) db.createObjectStore('files'); 
            }
        });
        const allKeys = await db.getAllKeys('files');
        setVms(allKeys);
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setLoading(true);
        setStatus("Écriture sur le disque de l'iPad...");
        try {
            const db = await idb.openDB('TahoeStorage', 1);
            await db.put('files', file, file.name);
            setStatus("Importation terminée !");
            await loadVMs();
        } catch (err) {
            alert("Erreur de stockage : " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const runTahoe = async (name) => {
        setLoading(true);
        setStatus("Démarrage du moteur 64-bit...");
        try {
            const db = await idb.openDB('TahoeStorage', 1);
            const isoBlob = await db.get('files', name);
            
            // Initialisation du moteur CheerpX
            const device = await CheerpX.CloudDevice.createFromBlob(isoBlob);
            const canvas = document.getElementById("display");

            setStatus("Boot de macOS 26 (Tahoe)...");
            
            await CheerpX.Linux.run({
                device: device,
                mounts: [{ type: "ext2", dev: device, path: "/" }],
                display: canvas,
                addressSpaceSize: 8192, // 8GB pour Tahoe 26
                cpu: "x86_64"
            });
        } catch (err) {
            alert("Erreur de boot : " + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Structure de l'interface (Version compatible iPad Safari)
    return h('div', { style: { display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' } },
        // Barre latérale
        h('div', { className: 'sidebar' },
            h('h2', { style: { marginBottom: '20px' } }, 'Tahoe 26 Manager'),
            h('button', { 
                className: 'btn-add', 
                onClick: () => document.getElementById('up').click(), 
                disabled: loading 
            }, loading ? 'Opération...' : '+ Importer ISO'),
            h('input', { 
                id: 'up', 
                type: 'file', 
                style: { display: 'none' }, 
                onChange: handleUpload 
            }),
            h('div', { style: { marginTop: '30px' } },
                vms.map(name => h('div', { 
                    key: name, 
                    className: 'vm-card', 
                    onClick: () => runTahoe(name) 
                },
                    h('div', { style: { fontWeight: 'bold' } }, name),
                    h('div', { className: 'status' }, 'Système Tahoe 64-bit')
                ))
            ),
            h('div', { style: { marginTop: 'auto', fontSize: '11px', color: '#888' } }, `Statut : ${status}`)
        ),
        // Zone d'affichage
        h('div', { className: 'main' },
            h('canvas', { id: 'display', style: { background: '#000' } }),
            vms.length === 0 && !loading && h('div', { 
                style: { position: 'absolute', color: '#555', textAlign: 'center' } 
            }, 
                h('p', null, 'Aucun ISO détecté dans le stockage local.'),
                h('p', null, 'Veuillez importer le Recovery de macOS Tahoe.')
            )
        )
    );
}

// Rendu final
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(h(TahoeApp));
