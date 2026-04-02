// DEBUGGER DE SECOURS POUR IPAD
window.onerror = function(msg, url, line) {
    document.body.innerHTML = `<div style="color:white;background:red;padding:20px;position:fixed;top:0;left:0;z-index:9999;width:100%">
        <h1>Erreur détectée</h1><p>${msg}</p><p>Ligne: ${line}</p>
    </div>`;
};

const { useState, useEffect, createElement: h } = React;

function TahoeApp() {
    const [vms, setVms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("Prêt");

    useEffect(() => {
        loadVMs();
    }, []);

    const loadVMs = async () => {
        const db = await idb.openDB('TahoeStorage', 1, {
            upgrade(db) { if (!db.objectStoreNames.contains('files')) db.createObjectStore('files'); }
        });
        const allKeys = await db.getAllKeys('files');
        setVms(allKeys);
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setLoading(true);
        setStatus("Stockage en cours...");
        const db = await idb.openDB('TahoeStorage', 1);
        await db.put('files', file, file.name);
        setStatus("Importé !");
        setLoading(false);
        loadVMs();
    };

    const runTahoe = async (name) => {
        setLoading(true);
        setStatus("Boot 64-bit...");
        try {
            const db = await idb.openDB('TahoeStorage', 1);
            const isoBlob = await db.get('files', name);
            const device = await CheerpX.CloudDevice.createFromBlob(isoBlob);
            await CheerpX.Linux.run({
                device: device,
                mounts: [{ type: "ext2", dev: device, path: "/" }],
                display: document.getElementById("display"),
                addressSpaceSize: 8192,
                cpu: "x86_64"
            });
        } catch (err) {
            alert(err.message);
        }
    };

    // Rendu en Pur JS (Sans JSX) pour éviter l'écran gris
    return h('div', { style: { display: 'flex', width: '100vw', height: '100vh' } },
        h('div', { className: 'sidebar' },
            h('h2', null, 'Tahoe 26 Manager'),
            h('button', { className: 'btn-add', onClick: () => document.getElementById('up').click(), disabled: loading }, 
                loading ? 'Patientez...' : '+ Importer ISO'
            ),
            h('input', { id: 'up', type: 'file', style: { display: 'none' }, onChange: handleUpload }),
            h('div', { style: { marginTop: '20px' } },
                vms.map(name => h('div', { key: name, className: 'vm-card', onClick: () => runTahoe(name) },
                    h('div', { style: { fontWeight: 'bold' } }, name),
                    h('div', { className: 'status' }, 'macOS 26 Ready')
                ))
            ),
            h('div', { style: { marginTop: 'auto', fontSize: '10px' } }, `Statut: ${status}`)
        ),
        h('div', { className: 'main' },
            h('canvas', { id: 'display' }),
            !vms.length && h('p', { style: { position: 'absolute' } }, 'Aucun ISO détecté.')
        )
    );
}

// Initialisation correcte pour le navigateur
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(h(TahoeApp));
