/* =========================================================
   BLOCK WORLD
   Jogo 3D estilo Minecraft
========================================================= */


/* =========================================================
   CONFIGURAÇÕES
========================================================= */

const WORLD_SIZE = 40;
const WORLD_HEIGHT = 12;

const BLOCK_SIZE = 1;


/* =========================================================
   ELEMENTOS HTML
========================================================= */

const game = document.getElementById("game");

const fpsElement =
    document.getElementById("fps");

const startScreen =
    document.getElementById("startScreen");

const startButton =
    document.getElementById("startButton");


/* =========================================================
   CENA
========================================================= */

const scene =
    new THREE.Scene();

scene.background =
    new THREE.Color(0x87ceeb);

scene.fog =
    new THREE.Fog(
        0x87ceeb,
        25,
        80
    );


/* =========================================================
   CÂMERA
========================================================= */

const camera =
    new THREE.PerspectiveCamera(
        75,
        window.innerWidth /
        window.innerHeight,
        0.1,
        200
    );

camera.position.set(
    0,
    5,
    8
);


/* =========================================================
   RENDERIZADOR
========================================================= */

const renderer =
    new THREE.WebGLRenderer({
        antialias: false,
        powerPreference:
            "high-performance"
    });

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.setPixelRatio(
    Math.min(
        window.devicePixelRatio,
        1.5
    )
);

renderer.shadowMap.enabled = false;

game.appendChild(
    renderer.domElement
);


/* =========================================================
   ILUMINAÇÃO
========================================================= */

const ambientLight =
    new THREE.HemisphereLight(
        0xffffff,
        0x555555,
        1.5
    );

scene.add(
    ambientLight
);


const sun =
    new THREE.DirectionalLight(
        0xffffff,
        1.2
    );

sun.position.set(
    30,
    50,
    20
);

scene.add(
    sun
);


/* =========================================================
   MATERIAIS DOS BLOCOS
========================================================= */

const materials = {

    grass:
        new THREE.MeshLambertMaterial({
            color: 0x55aa35
        }),

    dirt:
        new THREE.MeshLambertMaterial({
            color: 0x8b5a2b
        }),

    stone:
        new THREE.MeshLambertMaterial({
            color: 0x777777
        }),

    wood:
        new THREE.MeshLambertMaterial({
            color: 0x8b5a2b
        }),

    leaves:
        new THREE.MeshLambertMaterial({
            color: 0x2e8b35
        })

};


/* =========================================================
   GEOMETRIA DOS BLOCOS
========================================================= */

const cubeGeometry =
    new THREE.BoxGeometry(
        BLOCK_SIZE,
        BLOCK_SIZE,
        BLOCK_SIZE
    );


/* =========================================================
   SISTEMA DE BLOCOS
========================================================= */

const blocks =
    new Map();


function blockKey(x, y, z) {

    return `${x},${y},${z}`;

}


/* =========================================================
   ADICIONAR BLOCO
========================================================= */

function addBlock(
    x,
    y,
    z,
    type
) {

    const key =
        blockKey(
            x,
            y,
            z
        );

    if (
        blocks.has(key)
    ) {
        return;
    }


    const material =
        materials[type];


    if (!material) {
        return;
    }


    const cube =
        new THREE.Mesh(
            cubeGeometry,
            material
        );


    cube.position.set(
        x,
        y,
        z
    );


    cube.userData = {

        x: x,
        y: y,
        z: z,

        type: type

    };


    scene.add(
        cube
    );


    blocks.set(
        key,
        cube
    );

}


/* =========================================================
   REMOVER BLOCO
========================================================= */

function removeBlock(
    x,
    y,
    z
) {

    const key =
        blockKey(
            x,
            y,
            z
        );


    const block =
        blocks.get(key);


    if (!block) {
        return;
    }


    scene.remove(
        block
    );


    blocks.delete(
        key
    );

}


/* =========================================================
   ALTURA DO TERRENO
========================================================= */

function terrainHeight(
    x,
    z
) {

    const height =

        3 +

        Math.sin(
            x * 0.25
        ) * 1.2 +

        Math.cos(
            z * 0.23
        ) * 1.2 +

        Math.sin(
            (x + z) * 0.12
        ) * 1.5;


    return Math.floor(
        height
    );

}


/* =========================================================
   GERAR MUNDO
========================================================= */

function generateWorld() {

    for (
        let x = -WORLD_SIZE / 2;
        x < WORLD_SIZE / 2;
        x++
    ) {

        for (
            let z = -WORLD_SIZE / 2;
            z < WORLD_SIZE / 2;
            z++
        ) {

            const height =
                terrainHeight(
                    x,
                    z
                );


            /* =========================
               TERRENO
            ========================= */

            for (
                let y = 0;
                y <= height;
                y++
            ) {

                let type;


                if (
                    y === height
                ) {

                    type = "grass";

                }

                else if (
                    y >= height - 2
                ) {

                    type = "dirt";

                }

                else {

                    type = "stone";

                }


                addBlock(
                    x,
                    y,
                    z,
                    type
                );

            }


            /* =========================
               ÁRVORES
            ========================= */

            if (

                Math.random() < 0.025 &&

                Math.abs(x) > 3 &&

                Math.abs(z) > 3

            ) {

                createTree(
                    x,
                    height + 1,
                    z
                );

            }

        }

    }

}


/* =========================================================
   CRIAR ÁRVORE
========================================================= */

function createTree(
    x,
    y,
    z
) {

    /* Tronco */

    for (
        let i = 0;
        i < 4;
        i++
    ) {

        addBlock(
            x,
            y + i,
            z,
            "wood"
        );

    }


    /* Folhas */

    for (
        let dx = -2;
        dx <= 2;
        dx++
    ) {

        for (
            let dz = -2;
            dz <= 2;
            dz++
        ) {

            for (
                let dy = 2;
                dy <= 4;
                dy++
            ) {

                const distance =

                    Math.abs(dx) +
                    Math.abs(dz);


                if (
                    distance <= 2
                ) {

                    addBlock(
                        x + dx,
                        y + dy,
                        z + dz,
                        "leaves"
                    );

                }

            }

        }

    }

}


/* =========================================================
   CRIAR MUNDO
========================================================= */

generateWorld();


/* =========================================================
   TECLADO
========================================================= */

const keys = {};


document.addEventListener(
    "keydown",
    function(event) {

        keys[event.code] = true;


        /* PULAR */

        if (

            event.code === "Space" &&

            player.onGround

        ) {

            player.velocityY = 8;

            player.onGround = false;

        }


        /* BLOCO 1 */

        if (
            event.code === "Digit1"
        ) {

            selectedBlock =
                "grass";

            updateHotbar();

        }


        /* BLOCO 2 */

        if (
            event.code === "Digit2"
        ) {

            selectedBlock =
                "dirt";

            updateHotbar();

        }


        /* BLOCO 3 */

        if (
            event.code === "Digit3"
        ) {

            selectedBlock =
                "stone";

            updateHotbar();

        }


        /* BLOCO 4 */

        if (
            event.code === "Digit4"
        ) {

            selectedBlock =
                "wood";

            updateHotbar();

        }

    }
);


document.addEventListener(
    "keyup",
    function(event) {

        keys[event.code] = false;

    }
);


/* =========================================================
   MOUSE
========================================================= */

let yaw = 0;

let pitch = 0;


document.addEventListener(
    "mousemove",
    function(event) {

        if (

            document.pointerLockElement !==
            renderer.domElement

        ) {

            return;

        }


        yaw -=
            event.movementX *
            0.002;


        pitch -=
            event.movementY *
            0.002;


        pitch = Math.max(

            -Math.PI / 2 + 0.01,

            Math.min(
                Math.PI / 2 - 0.01,
                pitch
            )

        );


        camera.rotation.order =
            "YXZ";


        camera.rotation.y =
            yaw;


        camera.rotation.x =
            pitch;

    }
);


/* =========================================================
   JOGADOR
========================================================= */

const player = {

    velocityY: 0,

    speed: 5,

    onGround: false,

    height: 1.7

};


/* =========================================================
   ALTURA DO CHÃO
========================================================= */

function getGroundHeight(
    x,
    z
) {

    const bx =
        Math.floor(x);

    const bz =
        Math.floor(z);


    let highest = -100;


    for (
        let y = 0;
        y < WORLD_HEIGHT;
        y++
    ) {

        if (

            blocks.has(
                blockKey(
                    bx,
                    y,
                    bz
                )
            )

        ) {

            highest =
                y + 0.5;

        }

    }


    return highest;

}


/* =========================================================
   MOVIMENTO DO JOGADOR
========================================================= */

function updatePlayer(
    delta
) {

    const direction =
        new THREE.Vector3();


    /* W */

    if (
        keys["KeyW"]
    ) {

        direction.z -= 1;

    }


    /* S */

    if (
        keys["KeyS"]
    ) {

        direction.z += 1;

    }


    /* A */

    if (
        keys["KeyA"]
    ) {

        direction.x -= 1;

    }


    /* D */

    if (
        keys["KeyD"]
    ) {

        direction.x += 1;

    }


    if (
        direction.length() > 0
    ) {

        direction.normalize();


        direction.applyAxisAngle(

            new THREE.Vector3(
                0,
                1,
                0
            ),

            yaw

        );


        camera.position.x +=

            direction.x *
            player.speed *
            delta;


        camera.position.z +=

            direction.z *
            player.speed *
            delta;

    }


    /* =========================
       GRAVIDADE
    ========================= */

    player.velocityY -=

        20 *
        delta;


    camera.position.y +=

        player.velocityY *
        delta;


    /* =========================
       CHÃO
    ========================= */

    const ground =
        getGroundHeight(
            camera.position.x,
            camera.position.z
        );


    if (

        camera.position.y <
        ground + player.height

    ) {

        camera.position.y =
            ground + player.height;


        player.velocityY =
            0;


        player.onGround =
            true;

    }

    else {

        player.onGround =
            false;

    }

}


/* =========================================================
   RAYCAST
========================================================= */

const raycaster =
    new THREE.Raycaster();


function getTargetBlock() {

    raycaster.setFromCamera(

        new THREE.Vector2(
            0,
            0
        ),

        camera

    );


    const objects =
        Array.from(
            blocks.values()
        );


    const hits =
        raycaster.intersectObjects(
            objects,
            false
        );


    if (
        hits.length === 0
    ) {

        return null;

    }


    return hits[0];

}


/* =========================================================
   CLIQUE DO MOUSE
========================================================= */

renderer.domElement.addEventListener(
    "mousedown",
    function(event) {

        if (

            document.pointerLockElement !==
            renderer.domElement

        ) {

            return;

        }


        const hit =
            getTargetBlock();


        if (!hit) {
            return;
        }


        const block =
            hit.object;


        const data =
            block.userData;


        /* =========================
           BOTÃO ESQUERDO
           QUEBRAR
        ========================= */

        if (
            event.button === 0
        ) {

            removeBlock(

                data.x,
                data.y,
                data.z

            );

        }


        /* =========================
           BOTÃO DIREITO
           COLOCAR
        ========================= */

        if (
            event.button === 2
        ) {

            const normal =
                hit.face.normal.clone();


            const position =
                block.position.clone();


            position.add(
                normal
            );


            const x =
                Math.round(
                    position.x
                );


            const y =
                Math.round(
                    position.y
                );


            const z =
                Math.round(
                    position.z
                );


            if (

                y >= 0 &&
                y < WORLD_HEIGHT

            ) {

                addBlock(

                    x,
                    y,
                    z,
                    selectedBlock

                );

            }

        }

    }
);


/* =========================================================
   DESABILITAR MENU DO BOTÃO DIREITO
========================================================= */

document.addEventListener(
    "contextmenu",
    function(event) {

        event.preventDefault();

    }
);


/* =========================================================
   HOTBAR
========================================================= */

let selectedBlock =
    "grass";


function updateHotbar() {

    document
        .querySelectorAll(".slot")
        .forEach(
            function(slot) {

                slot.classList.remove(
                    "selected"
                );


                if (

                    slot.dataset.block ===
                    selectedBlock

                ) {

                    slot.classList.add(
                        "selected"
                    );

                }

            }
        );

}


/* =========================================================
   CLICAR NA HOTBAR
========================================================= */

document
    .querySelectorAll(".slot")
    .forEach(
        function(slot) {

            slot.addEventListener(
                "click",
                function() {

                    selectedBlock =
                        slot.dataset.block;

                    updateHotbar();

                }
            );

        }
    );


/* =========================================================
   BOTÃO JOGAR
========================================================= */

startButton.addEventListener(
    "click",
    function() {

        startScreen.style.display =
            "none";


        renderer.domElement
            .requestPointerLock();

    }
);


/* =========================================================
   CLICAR NO JOGO
========================================================= */

renderer.domElement.addEventListener(
    "click",
    function() {

        if (

            document.pointerLockElement !==
            renderer.domElement

        ) {

            renderer.domElement
                .requestPointerLock();

        }

    }
);


/* =========================================================
   FPS
========================================================= */

let frames = 0;

let fpsTime =
    performance.now();


function updateFPS() {

    frames++;


    const now =
        performance.now();


    if (
        now - fpsTime >= 1000
    ) {

        fpsElement.textContent =
            "FPS: " + frames;


        frames = 0;


        fpsTime =
            now;

    }

}


/* =========================================================
   LOOP PRINCIPAL
========================================================= */

let previousTime =
    performance.now();


function animate() {

    requestAnimationFrame(
        animate
    );


    const now =
        performance.now();


    let delta =

        (now - previousTime) /
        1000;


    previousTime =
        now;


    /* Evita saltos quando o navegador trava */

    delta =
        Math.min(
            delta,
            0.05
        );


    updatePlayer(
        delta
    );


    updateFPS();


    renderer.render(
        scene,
        camera
    );

}


animate();


/* =========================================================
   REDIMENSIONAMENTO DA JANELA
========================================================= */

window.addEventListener(
    "resize",
    function() {

        camera.aspect =

            window.innerWidth /
            window.innerHeight;


        camera.updateProjectionMatrix();


        renderer.setSize(

            window.innerWidth,
            window.innerHeight

        );

    }
);
