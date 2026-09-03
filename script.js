console.log("J01N - SCRIPT NOVO CARREGADO - TESTE 123");
alert("SCRIPT NOVO CARREGADO");

```javascript
import * as THREE from
  "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";


/*
==================================================
CONFIGURAÇÃO
==================================================
*/

const SEED =
  "mundo-greedy-v2";

const TAMANHO_MUNDO =
  100;

const PROFUNDIDADE_MUNDO =
  10;

const ALTURA_MAXIMA =
  25;

const TAMANHO_CHUNK =
  10;

const NUM_CHUNKS =
  TAMANHO_MUNDO / TAMANHO_CHUNK;

const DISTANCIA_CHUNKS =
  45;

const DISTANCIA_INTERACAO =
  5;

const TEMPO_QUEBRAR =
  0.5;


/*
==================================================
MOVIMENTO
==================================================
*/

const VELOCIDADE_ANDANDO =
  5;

const VELOCIDADE_CORRENDO =
  8.5;

const VELOCIDADE_AGACHADO =
  2.5;

const GRAVIDADE =
  -20;

const FORCA_PULO =
  7.2;

const ALTURA_NORMAL =
  1.8;

const ALTURA_AGACHADO =
  1.0;


/*
==================================================
CENA
==================================================
*/

const cena =
  new THREE.Scene();

cena.background =
  new THREE.Color(
    0x87ceeb
  );


/*
==================================================
CÂMERA
==================================================
*/

const camera =
  new THREE.PerspectiveCamera(

    75,

    window.innerWidth /
      window.innerHeight,

    0.1,

    1000

  );


/*
==================================================
RENDERER

IMPORTANTE:
não há limite de FPS.

O pixel ratio é limitado somente
para evitar renderização 3x/4x
em monitores de alta densidade.

==================================================
*/

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


renderer.outputColorSpace =
  THREE.SRGBColorSpace;


renderer.shadowMap.enabled =
  false;


document.body.appendChild(
  renderer.domElement
);


/*
==================================================
LUZ
==================================================
*/

cena.add(

  new THREE.HemisphereLight(

    0xffffff,
    0x555555,
    2

  )

);


const sol =
  new THREE.DirectionalLight(

    0xffffff,
    1.5

  );


sol.position.set(

  30,
  40,
  20

);


cena.add(
  sol
);


/*
==================================================
TEXTURAS
==================================================
*/

const loader =
  new THREE.TextureLoader();


function carregarTextura(
  nome
) {

  const textura =
    loader.load(

      `texturas/${nome}.png`,

      undefined,

      undefined,

      erro => {

        console.error(

          `Erro ao carregar texturas/${nome}.png`,

          erro

        );

      }

    );


  textura.magFilter =
    THREE.NearestFilter;


  textura.minFilter =
    THREE.NearestFilter;


  textura.wrapS =
    THREE.RepeatWrapping;


  textura.wrapT =
    THREE.RepeatWrapping;


  textura.colorSpace =
    THREE.SRGBColorSpace;


  return textura;

}


/*
==================================================
TIPOS
==================================================
*/

const tipos = {

  azul: {

    nome:
      "Pedra",

    textura:
      carregarTextura(
        "pedra"
      )

  },

  verde: {

    nome:
      "Grama",

    textura:
      carregarTextura(
        "grama"
      )

  },

  vermelho: {

    nome:
      "Tijolo",

    textura:
      carregarTextura(
        "tijolo"
      )

  },

  madeira: {

    nome:
      "Madeira",

    textura:
      carregarTextura(
        "madeira"
      )

  },

  terra: {

    nome:
      "Terra",

    textura:
      carregarTextura(
        "terra"
      )

  },

  areia: {

    nome:
      "Areia",

    textura:
      carregarTextura(
        "areia"
      )

  }

};


const TIPO_IDS = {

  vazio: 0,

  azul: 1,

  verde: 2,

  vermelho: 3,

  madeira: 4,

  terra: 5,

  areia: 6

};


const ID_TIPO = [

  null,

  "azul",

  "verde",

  "vermelho",

  "madeira",

  "terra",

  "areia"

];


/*
==================================================
MATERIAIS
==================================================
*/

const materiais =
  {};


for (
  const tipo
  of Object.keys(tipos)
) {

  materiais[tipo] =

    new THREE.MeshLambertMaterial({

      map:
        tipos[tipo].textura

    });

}


/*
==================================================
GEOMETRIA DE REFERÊNCIA
==================================================
*/

const geometriaCubo =
  new THREE.BoxGeometry(
    1,
    1,
    1
  );


/*
==================================================
MUNDO

Todos os blocos continuam na memória.

O que muda é somente a geometria
que está na GPU.

==================================================
*/

const blocos =
  new Map();


const alturasSuperficie =
  new Map();


/*
==================================================
CHUNKS NA GPU
==================================================
*/

const chunksRenderizados =
  new Map();


/*
==================================================
INVENTÁRIO
==================================================
*/

const inventario = {

  azul: 0,

  verde: 0,

  vermelho: 0,

  madeira: 0,

  terra: 0,

  areia: 0

};


let blocoAtual =
  "azul";


const tiposNumero = {

  azul: 1,

  verde: 2,

  vermelho: 3,

  madeira: 4,

  terra: 5,

  areia: 6

};


/*
==================================================
UI
==================================================
*/

const fpsElement =
  document.getElementById(
    "fps"
  );


const nomeBlocoElement =
  document.getElementById(
    "nomeBloco"
  );


const corSelecionadaElement =
  document.getElementById(
    "corSelecionada"
  );


const statusMovimento =
  document.getElementById(
    "statusMovimento"
  );


const quebrandoElement =
  document.getElementById(
    "quebrando"
  );


const progressoQuebrando =
  document.getElementById(
    "progressoQuebrando"
  );


const quantidadeElementos = {

  azul:
    document.getElementById(
      "quantidade1"
    ),

  verde:
    document.getElementById(
      "quantidade2"
    ),

  vermelho:
    document.getElementById(
      "quantidade3"
    ),

  madeira:
    document.getElementById(
      "quantidade4"
    ),

  terra:
    document.getElementById(
      "quantidade5"
    ),

  areia:
    document.getElementById(
      "quantidade6"
    )

};


/*
==================================================
CHAVES
==================================================
*/

function chave(
  x,
  y,
  z
) {

  return (
    `${x},${y},${z}`
  );

}


function chaveChunk(
  x,
  z
) {

  return (
    `${x},${z}`
  );

}


/*
==================================================
BLOCO
==================================================
*/

function pegarBloco(
  x,
  y,
  z
) {

  return blocos.get(

    chave(
      x,
      y,
      z
    )

  );

}


function existeBloco(
  x,
  y,
  z
) {

  return blocos.has(

    chave(
      x,
      y,
      z
    )

  );

}


function salvarBloco(

  x,
  y,
  z,
  tipo

) {

  blocos.set(

    chave(
      x,
      y,
      z
    ),

    {

      x,
      y,
      z,
      tipo

    }

  );

}


function removerBloco(

  x,
  y,
  z

) {

  blocos.delete(

    chave(
      x,
      y,
      z

    )

  );

}


/*
==================================================
GERADOR
==================================================
*/

function criarGerador(
  seed
) {

  let valor =
    0;


  for (
    let i = 0;
    i < seed.length;
    i++
  ) {

    valor = (

      valor *
      31 +

      seed.charCodeAt(i)

    ) | 0;

  }


  return () => {

    valor = (

      valor *
      1664525 +

      1013904223

    ) | 0;


    return (

      valor >>> 0

    ) / 4294967296;

  };

}


/*
==================================================
MUNDO
==================================================
*/

function gerarMundo() {

  blocos.clear();

  alturasSuperficie.clear();


  const random =
    criarGerador(
      SEED
    );


  const metade =
    TAMANHO_MUNDO /
    2;


  /*
  ================================================
  MONTANHAS
  ================================================
  */

  const montanhas =
    [];


  for (
    let i = 0;
    i < 10;
    i++
  ) {

    const x =

      Math.floor(

        random() *
        (
          TAMANHO_MUNDO -
          20

        )

      )

      - metade
      + 10;


    const z =

      Math.floor(

        random() *
        (
          TAMANHO_MUNDO -
          20

        )

      )

      - metade
      + 10;


    montanhas.push({

      x,

      z,

      raio:
        6 +
        Math.floor(
          random() * 8
        ),

      altura:
        4 +
        Math.floor(
          random() * 10
        )

    });

  }


  /*
  ================================================
  ÁREAS
  ================================================
  */

  const tiposArea = [

    "verde",
    "azul",
    "terra",
    "vermelho",
    "areia"

  ];


  /*
  ================================================
  TERRENO
  ================================================
  */

  for (
    let x = -metade;
    x < metade;
    x++
  ) {

    for (
      let z = -metade;
      z < metade;
      z++
    ) {

      let altura =
        0;


      /*
      Montanhas.
      */

      for (
        const montanha
        of montanhas
      ) {

        const dx =
          x -
          montanha.x;


        const dz =
          z -
          montanha.z;


        const distancia =
          Math.sqrt(

            dx * dx +
            dz * dz

          );


        if (
          distancia <
          montanha.raio
        ) {

          const fator =

            1 -
            (
              distancia /
              montanha.raio
            );


          const alturaMontanha =

            Math.floor(

              fator *
              fator *
              montanha.altura

            );


          altura =
            Math.max(

              altura,

              alturaMontanha

            );

        }

      }


      /*
      Áreas de 10x10.
      */

      const areaX =
        Math.floor(

          (
            x +
            metade
          ) /
          10

        );


      const areaZ =
        Math.floor(

          (
            z +
            metade
          ) /
          10

        );


      const valor =

        (
          areaX *
          73856093 +

          areaZ *
          19349663

        ) >>> 0;


      let tipoSuperficie =

        tiposArea[

          valor %
          tiposArea.length

        ];


      /*
      Spawn plano.
      */

      if (

        Math.abs(x) <= 4 &&

        Math.abs(z) <= 4

      ) {

        altura =
          0;

        tipoSuperficie =
          "verde";

      }


      alturasSuperficie.set(

        `${x},${z}`,

        altura

      );


      /*
      SUPERFÍCIE
      */

      salvarBloco(

        x,
        altura,
        z,

        tipoSuperficie

      );


      /*
      SUBSOLO.

      São 10 blocos de profundidade.
      */

      for (
        let d = 1;
        d < PROFUNDIDADE_MUNDO;
        d++
      ) {

        salvarBloco(

          x,

          altura - d,

          z,

          d <= 3

            ? "terra"

            : "azul"

        );

      }

    }

  }


  /*
  ================================================
  ÁRVORES
  ================================================
  */

  for (
    let i = 0;
    i < 50;
    i++
  ) {

    const x =

      Math.floor(
        random() * 90
      ) - 45;


    const z =

      Math.floor(
        random() * 90
      ) - 45;


    if (

      Math.abs(x) <= 6 &&
      Math.abs(z) <= 6

    ) {

      continue;

    }


    const altura =
      alturasSuperficie.get(

        `${x},${z}`

      );


    if (
      altura === undefined
    ) {

      continue;

    }


    if (
      altura > 7
    ) {

      continue;

    }


    salvarBloco(

      x,
      altura + 1,
      z,

      "madeira"

    );


    salvarBloco(

      x,
      altura + 2,
      z,

      "madeira"

    );

  }

}


/*
==================================================
GREEDY MESHING

Esta é a parte importante.

Faces adjacentes do mesmo tipo
são fundidas em uma única quad.

==================================================
*/

function adicionarQuad(

  dados,

  a,
  b,
  c,
  d,

  largura,
  altura

) {

  const inicio =

    dados.vertices.length /
    3;


  dados.vertices.push(

    ...a,
    ...b,
    ...c,
    ...d

  );


  dados.indices.push(

    inicio,
    inicio + 1,
    inicio + 2,

    inicio,
    inicio + 2,
    inicio + 3

  );


  /*
  UV repetido.
  */

  dados.uvs.push(

    0,
    0,

    largura,
    0,

    largura,
    altura,

    0,
    altura

  );

}


/*
==================================================
FACE X
==================================================
*/

function gerarFacesX(

  dados,
  inicioX,
  inicioZ,
  larguraZ,
  alturaY

) {

  for (
    let x = inicioX;
    x < inicioX + TAMANHO_CHUNK;
    x++
  ) {

    /*
    direita
    */

    const mascaraDireita =
      [];


    for (
      let y = 0;
      y < alturaY;
      y++
    ) {

      mascaraDireita[y] =
        [];


      for (
        let z = 0;
        z < larguraZ;
        z++
      ) {

        const mundoY =
          y - 10;


        const mundoZ =
          inicioZ + z;


        const bloco =
          pegarBloco(

            x,
            mundoY,
            mundoZ

          );


        if (

          bloco &&

          !existeBloco(

            x + 1,
            mundoY,
            mundoZ

          )

        ) {

          mascaraDireita[y][z] =
            TIPO_IDS[
              bloco.tipo
            ];

        }

        else {

          mascaraDireita[y][z] =
            0;

        }

      }

    }


    fundirMascaraVertical(

      dados,

      mascaraDireita,

      larguraZ,

      alturaY,

      x,

      true,

      inicioZ

    );


    /*
    esquerda
    */

    const mascaraEsquerda =
      [];


    for (
      let y = 0;
      y < alturaY;
      y++
    ) {

      mascaraEsquerda[y] =
        [];


      for (
        let z = 0;
        z < larguraZ;
        z++
      ) {

        const mundoY =
          y - 10;


        const mundoZ =
          inicioZ + z;


        const bloco =
          pegarBloco(

            x,
            mundoY,
            mundoZ

          );


        if (

          bloco &&

          !existeBloco(

            x - 1,
            mundoY,
            mundoZ

          )

        ) {

          mascaraEsquerda[y][z] =
            TIPO_IDS[
              bloco.tipo
            ];

        }

        else {

          mascaraEsquerda[y][z] =
            0;

        }

      }

    }


    fundirMascaraVertical(

      dados,

      mascaraEsquerda,

      larguraZ,

      alturaY,

      x,

      false,

      inicioZ

    );

  }

}


/*
==================================================
FUSÃO MÁSCARA VERTICAL
==================================================
*/

function fundirMascaraVertical(

  dados,
  mascara,
  largura,
  altura,
  x,
  direita,
  inicioZ

) {

  for (
    let y = 0;
    y < altura;
    y++
  ) {

    for (
      let z = 0;
      z < largura;
      z++
    ) {

      const valor =
        mascara[y][z];


      if (
        !valor
      ) {

        continue;

      }


      let larguraQuad =
        1;


      while (

        z + larguraQuad <
          largura &&

        mascara[y][
          z + larguraQuad
        ] === valor

      ) {

        larguraQuad++;

      }


      let alturaQuad =
        1;


      let continua =
        true;


      while (

        y + alturaQuad <
          altura &&

        continua

      ) {

        for (
          let zz = z;
          zz <
            z + larguraQuad;
          zz++
        ) {

          if (

            mascara[
              y + alturaQuad
            ][zz] !== valor

          ) {

            continua =
              false;

            break;

          }

        }


        if (
          continua
        ) {

          alturaQuad++;

        }

      }


      const yMundo =
        y - 10;


      const zMundo =
        inicioZ + z;


      const faceX =

        direita
          ? x + 0.5
          : x - 0.5;


      let a;
      let b;
      let c;
      let d;


      if (
        direita
      ) {

        a = [

          faceX,

          yMundo - 0.5,

          zMundo

        ];


        b = [

          faceX,

          yMundo +
            alturaQuad -
            0.5,

          zMundo

        ];


        c = [

          faceX,

          yMundo +
            alturaQuad -
            0.5,

          zMundo +
            larguraQuad

        ];


        d = [

          faceX,

          yMundo - 0.5,

          zMundo +
            larguraQuad

        ];

      }

      else {

        a = [

          faceX,

          yMundo - 0.5,

          zMundo +
            larguraQuad

        ];


        b = [

          faceX,

          yMundo +
            alturaQuad -
            0.5,

          zMundo +
            larguraQuad

        ];


        c = [

          faceX,

          yMundo +
            alturaQuad -
            0.5,

          zMundo

        ];


        d = [

          faceX,

          yMundo - 0.5,

          zMundo

        ];

      }


      adicionarQuad(

        dados,

        a,
        b,
        c,
        d,

        larguraQuad,
        alturaQuad

      );


      /*
      Limpa a região.
      */

      for (
        let yy = y;
        yy <
          y + alturaQuad;
        yy++
      ) {

        for (
          let zz = z;
          zz <
            z + larguraQuad;
          zz++
        ) {

          mascara[yy][zz] =
            0;

        }

      }

    }

  }

}


/*
==================================================
FACE Y
==================================================
*/

function gerarFacesY(

  dados,
  inicioX,
  inicioZ,
  tamanhoY

) {

  for (
    let y = -10;
    y <= tamanhoY - 10;
    y++
  ) {

    for (
      const cima
      of [true, false]
    ) {

      const mascara = [];


      for (
        let z = 0;
        z < TAMANHO_CHUNK;
        z++
      ) {

        mascara[z] = [];


        for (
          let x = 0;
          x < TAMANHO_CHUNK;
          x++
        ) {

          const mundoX =
            inicioX + x;


          const mundoZ =
            inicioZ + z;


          const bloco =
            pegarBloco(

              mundoX,
              y,
              mundoZ

            );


          const vizinho =
            cima

              ? existeBloco(
                  mundoX,
                  y + 1,
                  mundoZ
                )

              : existeBloco(
                  mundoX,
                  y - 1,
                  mundoZ
                );


          if (
            bloco &&
            !vizinho
          ) {

            mascara[z][x] =
              TIPO_IDS[
                bloco.tipo
              ];

          }

          else {

            mascara[z][x] =
              0;

          }

        }

      }


      fundirMascaraHorizontal(

        dados,

        mascara,

        cima,

        y,

        inicioX,
        inicioZ

      );

    }

  }

}


/*
==================================================
FUSÃO HORIZONTAL
==================================================
*/

function fundirMascaraHorizontal(

  dados,
  mascara,
  cima,
  y,
  inicioX,
  inicioZ

) {

  for (
    let z = 0;
    z < TAMANHO_CHUNK;
    z++
  ) {

    for (
      let x = 0;
      x < TAMANHO_CHUNK;
      x++
    ) {

      const valor =
        mascara[z][x];


      if (
        !valor
      ) {

        continue;

      }


      let largura =
        1;


      while (

        x + largura <
          TAMANHO_CHUNK &&

        mascara[z][
          x + largura
        ] === valor

      ) {

        largura++;

      }


      let profundidade =
        1;


      let continua =
        true;


      while (

        z + profundidade <
          TAMANHO_CHUNK &&

        continua

      ) {

        for (
          let xx = x;
          xx <
            x + largura;
          xx++
        ) {

          if (
            mascara[
              z + profundidade
            ][xx] !== valor
          ) {

            continua =
              false;

            break;

          }

        }


        if (
          continua
        ) {

          profundidade++;

        }

      }


      const xm =
        inicioX + x;


      const zm =
        inicioZ + z;


      const ym =
        y;


      const faceY =
        cima
          ? ym + 0.5
          : ym - 0.5;


      let a;
      let b;
      let c;
      let d;


      if (
        cima
      ) {

        a = [

          xm - 0.0,

          faceY,

          zm

        ];


        b = [

          xm + largura,

          faceY,

          zm

        ];


        c = [

          xm + largura,

          faceY,

          zm +
            profundidade

        ];


        d = [

          xm,

          faceY,

          zm +
            profundidade

        ];

      }

      else {

        a = [

          xm,

          faceY,

          zm +
            profundidade

        ];


        b = [

          xm + largura,

          faceY,

          zm +
            profundidade

        ];


        c = [

          xm + largura,

          faceY,

          zm

        ];


        d = [

          xm,

          faceY,

          zm

        ];

      }


      /*
      Ajuste de posição:

      os blocos têm centro em coordenadas
      inteiras e tamanho 1.
      */

      a[0] -= 0.5;
      b[0] -= 0.5;
      c[0] -= 0.5;
      d[0] -= 0.5;


      a[2] -= 0.5;
      b[2] -= 0.5;
      c[2] -= 0.5;
      d[2] -= 0.5;


      adicionarQuad(

        dados,

        a,
        b,
        c,
        d,

        largura,
        profundidade

      );


      for (
        let zz = z;
        zz <
          z + profundidade;
        zz++
      ) {

        for (
          let xx = x;
          xx <
            x + largura;
          xx++
        ) {

          mascara[zz][xx] =
            0;

        }

      }

    }

  }

}


/*
==================================================
FACE Z
==================================================
*/

function gerarFacesZ(

  dados,
  inicioX,
  inicioZ,
  tamanhoY

) {

  for (
    let z = inicioZ;
    z < inicioZ + TAMANHO_CHUNK;
    z++
  ) {

    for (
      const frente
      of [true, false]
    ) {

      const mascara = [];


      for (
        let y = 0;
        y < tamanhoY;
        y++
      ) {

        mascara[y] = [];


        for (
          let x = 0;
          x < TAMANHO_CHUNK;
          x++
        ) {

          const mundoX =
            inicioX + x;


          const mundoY =
            y - 10;


          const bloco =
            pegarBloco(

              mundoX,
              mundoY,
              z

            );


          const vizinho =
            frente

              ? existeBloco(
                  mundoX,
                  mundoY,
                  z - 1
                )

              : existeBloco(
                  mundoX,
                  mundoY,
                  z + 1
                );


          if (
            bloco &&
            !vizinho
          ) {

            mascara[y][x] =
              TIPO_IDS[
                bloco.tipo
              ];

          }

          else {

            mascara[y][x] =
              0;

          }

        }

      }


      fundirMascaraZ(

        dados,

        mascara,

        frente,

        z,
        inicioX

      );

    }

  }

}


/*
==================================================
FUSÃO Z
==================================================
*/

function fundirMascaraZ(

  dados,
  mascara,
  frente,
  z,
  inicioX

) {

  const altura =
    mascara.length;


  for (
    let y = 0;
    y < altura;
    y++
  ) {

    for (
      let x = 0;
      x < TAMANHO_CHUNK;
      x++
    ) {

      const valor =
        mascara[y][x];


      if (
        !valor
      ) {

        continue;

      }


      let largura =
        1;


      while (

        x + largura <
          TAMANHO_CHUNK &&

        mascara[y][
          x + largura
        ] === valor

      ) {

        largura++;

      }


      let alturaQuad =
        1;


      let continua =
        true;


      while (

        y + alturaQuad <
          altura &&

        continua

      ) {

        for (
          let xx = x;
          xx <
            x + largura;
          xx++
        ) {

          if (
            mascara[
              y + alturaQuad
            ][xx] !== valor
          ) {

            continua =
              false;

            break;

          }

        }


        if (
          continua
        ) {

          alturaQuad++;

        }

      }


      const xm =
        inicioX + x;


      const ym =
        y - 10;


      const zm =
        z;


      const faceZ =
        frente
          ? zm - 0.5
          : zm + 0.5;


      let a;
      let b;
      let c;
      let d;


      if (
        frente
      ) {

        a = [

          xm - 0.5,

          ym - 0.5,

          faceZ

        ];


        b = [

          xm - 0.5,

          ym +
            alturaQuad -
            0.5,

          faceZ

        ];


        c = [

          xm +
            largura -
            0.5,

          ym +
            alturaQuad -
            0.5,

          faceZ

        ];


        d = [

          xm +
            largura -
            0.5,

          ym - 0.5,

          faceZ

        ];

      }

      else {

        a = [

          xm +
            largura -
            0.5,

          ym - 0.5,

          faceZ

        ];


        b = [

          xm +
            largura -
            0.5,

          ym +
            alturaQuad -
            0.5,

          faceZ

        ];


        c = [

          xm - 0.5,

          ym +
            alturaQuad -
            0.5,

          faceZ

        ];


        d = [

          xm - 0.5,

          ym - 0.5,

          faceZ

        ];

      }


      adicionarQuad(

        dados,

        a,
        b,
        c,
        d,

        largura,
        alturaQuad

      );


      for (
        let yy = y;
        yy <
          y + alturaQuad;
        yy++
      ) {

        for (
          let xx = x;
          xx <
            x + largura;
          xx++
        ) {

          mascara[yy][xx] =
            0;

        }

      }

    }

  }

}


/*
==================================================
GERAR CHUNK COMPLETO
==================================================
*/

function gerarGeometriaChunk(

  chunkX,
  chunkZ

) {

  const inicioX =

    chunkX *
    TAMANHO_CHUNK -

    TAMANHO_MUNDO /
    2;


  const inicioZ =

    chunkZ *
    TAMANHO_CHUNK -

    TAMANHO_MUNDO /
    2;


  const dadosPorTipo =
    {};


  for (
    const tipo
    of Object.keys(
      tipos
    )
  ) {

    dadosPorTipo[tipo] = {

      vertices: [],
      indices: [],
      uvs: []

    };

  }


  const tamanhoY =
    ALTURA_MAXIMA +
    10;


  /*
  ================================================
  X
  ================================================
  */

  for (
    const dados
    of Object.values(
      dadosPorTipo
    )
  ) {

    /*
    As funções abaixo são gerais,
    portanto precisamos gerar por tipo
    separadamente para preservar as texturas.
    */

  }


  /*
  Para manter a geometria correta por tipo,
  criamos máscaras filtradas por tipo.
  */

  for (
    const tipo
    of Object.keys(
      tipos
    )
  ) {

    const dados =
      dadosPorTipo[tipo];


    gerarFacesXTipo(

      dados,
      inicioX,
      inicioZ,
      tamanhoY,
      tipo

    );


    gerarFacesYTipo(

      dados,
      inicioX,
      inicioZ,
      tamanhoY,
      tipo

    );


    gerarFacesZTipo(

      dados,
      inicioX,
      inicioZ,
      tamanhoY,
      tipo

    );

  }


  return dadosPorTipo;

}


/*
==================================================
VERSÕES FILTRADAS PARA GREEDY
==================================================
*/

function gerarFacesXTipo(

  dados,
  inicioX,
  inicioZ,
  tamanhoY,
  tipo

) {

  for (
    let x = inicioX;
    x < inicioX + TAMANHO_CHUNK;
    x++
  ) {

    for (
      const direita
      of [true, false]
    ) {

      const mascara =
        Array.from(

          {
            length:
              tamanhoY

          },

          () =>
            new Array(
              TAMANHO_CHUNK
            ).fill(0)

        );


      for (
        let y = 0;
        y < tamanhoY;
        y++
      ) {

        for (
          let z = 0;
          z < TAMANHO_CHUNK;
          z++
        ) {

          const mundoY =
            y - 10;


          const mundoZ =
            inicioZ + z;


          const bloco =
            pegarBloco(

              x,
              mundoY,
              mundoZ

            );


          if (
            !bloco ||
            bloco.tipo !== tipo
          ) {

            continue;

          }


          const vizinho =

            direita

              ? existeBloco(
                  x + 1,
                  mundoY,
                  mundoZ
                )

              : existeBloco(
                  x - 1,
                  mundoY,
                  mundoZ
                );


          if (
            !vizinho
          ) {

            mascara[y][z] =
              1;

          }

        }

      }


      fundirMascaraXTipo(

        dados,
        mascara,

        x,
        inicioZ,

        direita,

        tipo

      );

    }

  }

}


function fundirMascaraXTipo(

  dados,
  mascara,

  x,
  inicioZ,

  direita,
  tipo

) {

  const altura =
    mascara.length;


  for (
    let y = 0;
    y < altura;
    y++
  ) {

    for (
      let z = 0;
      z < TAMANHO_CHUNK;
      z++
    ) {

      if (
        !mascara[y][z]
      ) {

        continue;

      }


      let largura =
        1;


      while (

        z + largura <
          TAMANHO_CHUNK &&

        mascara[y][
          z + largura
        ]

      ) {

        largura++;

      }


      let alturaQuad =
        1;


      let continua =
        true;


      while (

        y + alturaQuad <
          altura &&

        continua

      ) {

        for (
          let zz = z;
          zz <
            z + largura;
          zz++
        ) {

          if (
            !mascara[
              y + alturaQuad
            ][zz]
          ) {

            continua =
              false;

            break;

          }

        }


        if (
          continua
        ) {

          alturaQuad++;

        }

      }


      const faceX =
        direita
          ? x + 0.5
          : x - 0.5;


      const ym =
        y - 10;


      const zm =
        inicioZ + z;


      let a;
      let b;
      let c;
      let d;


      if (
        direita
      ) {

        a = [

          faceX,
          ym - 0.5,
          zm

        ];


        b = [

          faceX,
          ym +
            alturaQuad -
            0.5,

          zm

        ];


        c = [

          faceX,
          ym +
            alturaQuad -
            0.5,

          zm +
            largura

        ];


        d = [

          faceX,
          ym - 0.5,

          zm +
            largura

        ];

      }

      else {

        a = [

          faceX,
          ym - 0.5,

          zm +
            largura

        ];


        b = [

          faceX,
          ym +
            alturaQuad -
            0.5,

          zm +
            largura

        ];


        c = [

          faceX,
          ym +
            alturaQuad -
            0.5,

          zm

        ];


        d = [

          faceX,
          ym - 0.5,

          zm

        ];

      }


      adicionarQuad(

        dados,

        a,
        b,
        c,
        d,

        largura,
        alturaQuad

      );


      for (
        let yy = y;
        yy <
          y +
          alturaQuad;
        yy++
      ) {

        for (
          let zz = z;
          zz <
            z +
            largura;
          zz++
        ) {

          mascara[yy][zz] =
            0;

        }

      }

    }

  }

}


function gerarFacesYTipo(

  dados,
  inicioX,
  inicioZ,
  tamanhoY,
  tipo

) {

  for (
    let y = -10;
    y <
      tamanhoY - 10;
    y++
  ) {

    for (
      const cima
      of [true, false]
    ) {

      const mascara =

        Array.from(

          {
            length:
              TAMANHO_CHUNK

          },

          () =>
            new Array(
              TAMANHO_CHUNK
            ).fill(0)

        );


      for (
        let z = 0;
        z <
          TAMANHO_CHUNK;
        z++
      ) {

        for (
          let x = 0;
          x <
            TAMANHO_CHUNK;
          x++
        ) {

          const mundoX =
            inicioX + x;


          const mundoZ =
            inicioZ + z;


          const bloco =
            pegarBloco(

              mundoX,
              y,
              mundoZ

            );


          if (
            !bloco ||
            bloco.tipo !== tipo
          ) {

            continue;

          }


          const vizinho =
            cima

              ? existeBloco(
                  mundoX,
                  y + 1,
                  mundoZ
                )

              : existeBloco(
                  mundoX,
                  y - 1,
                  mundoZ
                );


          if (
            !vizinho
          ) {

            mascara[z][x] =
              1;

          }

        }

      }


      fundirMascaraYTipo(

        dados,
        mascara,

        y,
        inicioX,
        inicioZ,

        cima

      );

    }

  }

}


function fundirMascaraYTipo(

  dados,
  mascara,

  y,
  inicioX,
  inicioZ,

  cima

) {

  for (
    let z = 0;
    z < TAMANHO_CHUNK;
    z++
  ) {

    for (
      let x = 0;
      x < TAMANHO_CHUNK;
      x++
    ) {

      if (
        !mascara[z][x]
      ) {

        continue;

      }


      let largura =
        1;


      while (

        x + largura <
          TAMANHO_CHUNK &&

        mascara[z][
          x + largura
        ]

      ) {

        largura++;

      }


      let profundidade =
        1;


      let continua =
        true;


      while (

        z + profundidade <
          TAMANHO_CHUNK &&

        continua

      ) {

        for (
          let xx = x;
          xx <
            x + largura;
          xx++
        ) {

          if (
            !mascara[
              z + profundidade
            ][xx]
          ) {

            continua =
              false;

            break;

          }

        }


        if (
          continua
        ) {

          profundidade++;

        }

      }


      const faceY =
        cima
          ? y + 0.5
          : y - 0.5;


      const xm =
        inicioX + x;


      const zm =
        inicioZ + z;


      let a;
      let b;
      let c;
      let d;


      if (
        cima
      ) {

        a = [

          xm - 0.5,
          faceY,
          zm - 0.5

        ];


        b = [

          xm - 0.5 +
            largura,

          faceY,

          zm - 0.5

        ];


        c = [

          xm - 0.5 +
            largura,

          faceY,

          zm - 0.5 +
            profundidade

        ];


        d = [

          xm - 0.5,

          faceY,

          zm - 0.5 +
            profundidade

        ];

      }

      else {

        a = [

          xm - 0.5,

          faceY,

          zm - 0.5 +
            profundidade

        ];


        b = [

          xm - 0.5 +
            largura,

          faceY,

          zm - 0.5 +
            profundidade

        ];


        c = [

          xm - 0.5 +
            largura,

          faceY,

          zm - 0.5

        ];


        d = [

          xm - 0.5,

          faceY,

          zm - 0.5

        ];

      }


      adicionarQuad(

        dados,

        a,
        b,
        c,
        d,

        largura,
        profundidade

      );


      for (
        let zz = z;
        zz <
          z + profundidade;
        zz++
      ) {

        for (
          let xx = x;
          xx <
            x + largura;
          xx++
        ) {

          mascara[zz][xx] =
            0;

        }

      }

    }

  }

}


function gerarFacesZTipo(

  dados,
  inicioX,
  inicioZ,
  tamanhoY,
  tipo

) {

  for (
    let z = inicioZ;
    z <
      inicioZ +
      TAMANHO_CHUNK;
    z++
  ) {

    for (
      const frente
      of [true, false]
    ) {

      const mascara =

        Array.from(

          {
            length:
              tamanhoY

          },

          () =>
            new Array(
              TAMANHO_CHUNK
            ).fill(0)

        );


      for (
        let y = 0;
        y < tamanhoY;
        y++
      ) {

        for (
          let x = 0;
          x < TAMANHO_CHUNK;
          x++
        ) {

          const mundoX =
            inicioX + x;


          const mundoY =
            y - 10;


          const bloco =
            pegarBloco(

              mundoX,
              mundoY,
              z

            );


          if (
            !bloco ||
            bloco.tipo !== tipo
          ) {

            continue;

          }


          const vizinho =
            frente

              ? existeBloco(
                  mundoX,
                  mundoY,
                  z - 1
                )

              : existeBloco(
                  mundoX,
                  mundoY,
                  z + 1
                );


          if (
            !vizinho
          ) {

            mascara[y][x] =
              1;

          }

        }

      }


      fundirMascaraZTipo(

        dados,
        mascara,

        z,
        inicioX,

        frente

      );

    }

  }

}


function fundirMascaraZTipo(

  dados,
  mascara,

  z,
  inicioX,

  frente

) {

  const altura =
    mascara.length;


  for (
    let y = 0;
    y < altura;
    y++
  ) {

    for (
      let x = 0;
      x < TAMANHO_CHUNK;
      x++
    ) {

      if (
        !mascara[y][x]
      ) {

        continue;

      }


      let largura =
        1;


      while (

        x + largura <
          TAMANHO_CHUNK &&

        mascara[y][
          x + largura
        ]

      ) {

        largura++;

      }


      let alturaQuad =
        1;


      let continua =
        true;


      while (

        y + alturaQuad <
          altura &&

        continua

      ) {

        for (
          let xx = x;
          xx <
            x + largura;
          xx++
        ) {

          if (
            !mascara[
              y + alturaQuad
            ][xx]
          ) {

            continua =
              false;

            break;

          }

        }


        if (
          continua
        ) {

          alturaQuad++;

        }

      }


      const faceZ =
        frente
          ? z - 0.5
          : z + 0.5;


      const xm =
        inicioX + x;


      const ym =
        y - 10;


      let a;
      let b;
      let c;
      let d;


      if (
        frente
      ) {

        a = [

          xm - 0.5,
          ym - 0.5,
          faceZ

        ];


        b = [

          xm - 0.5,

          ym +
            alturaQuad -
            0.5,

          faceZ

        ];


        c = [

          xm - 0.5 +
            largura,

          ym +
            alturaQuad -
            0.5,

          faceZ

        ];


        d = [

          xm - 0.5 +
            largura,

          ym - 0.5,

          faceZ

        ];

      }

      else {

        a = [

          xm - 0.5 +
            largura,

          ym - 0.5,

          faceZ

        ];


        b = [

          xm - 0.5 +
            largura,

          ym +
            alturaQuad -
            0.5,

          faceZ

        ];


        c = [

          xm - 0.5,

          ym +
            alturaQuad -
            0.5,

          faceZ

        ];


        d = [

          xm - 0.5,

          ym - 0.5,

          faceZ

        ];

      }


      adicionarQuad(

        dados,

        a,
        b,
        c,
        d,

        largura,
        alturaQuad

      );


      for (
        let yy = y;
        yy <
          y + alturaQuad;
        yy++
      ) {

        for (
          let xx = x;
          xx <
            x + largura;
          xx++
        ) {

          mascara[yy][xx] =
            0;

        }

      }

    }

  }

}


/*
==================================================
CRIAR MESH DO CHUNK
==================================================
*/

function construirChunk(

  chunkX,
  chunkZ

) {

  const id =
    chaveChunk(
      chunkX,
      chunkZ
    );


  removerChunk(

    chunkX,
    chunkZ

  );


  const geometrias =
    gerarGeometriasChunk(

      chunkX,
      chunkZ

    );


  const meshes =
    [];


  for (
    const tipo
    of Object.keys(
      tipos
    )
  ) {

    const dados =
      geometrias[tipo];


    if (

      !dados ||

      dados.vertices.length === 0

    ) {

      continue;

    }


    const geometria =
      new THREE.BufferGeometry();


    geometria.setAttribute(

      "position",

      new THREE.Float32BufferAttribute(

        dados.vertices,
        3

      )

    );


    geometria.setAttribute(

      "uv",

      new THREE.Float32BufferAttribute(

        dados.uvs,
        2

      )

    );


    geometria.setIndex(
      dados.indices
    );


    geometria.computeBoundingSphere();


    const mesh =
      new THREE.Mesh(

        geometria,

        materiais[tipo]

      );


    mesh.frustumCulled =
      true;


    mesh.userData.chunkX =
      chunkX;


    mesh.userData.chunkZ =
      chunkZ;


    mesh.userData.tipo =
      tipo;


    cena.add(
      mesh
    );


    meshes.push(
      mesh
    );

  }


  chunksRenderizados.set(

    id,

    meshes

  );

}


/*
==================================================
GERAR GEOMETRIAS

Essa função é separada para manter
o fluxo organizado.

==================================================
*/

function gerarGeometriasChunk(

  chunkX,
  chunkZ

) {

  const inicioX =

    chunkX *
    TAMANHO_CHUNK -

    TAMANHO_MUNDO /
    2;


  const inicioZ =

    chunkZ *
    TAMANHO_CHUNK -

    TAMANHO_MUNDO /
    2;


  const geometrias =
    {};


  for (
    const tipo
    of Object.keys(
      tipos
    )
  ) {

    geometrias[tipo] = {

      vertices: [],
      indices: [],
      uvs: []

    };

  }


  const altura =
    ALTURA_MAXIMA +
    10;


  for (
    const tipo
    of Object.keys(
      tipos
    )
  ) {

    const dados =
      geometrias[tipo];


    gerarFacesXTipo(

      dados,

      inicioX,
      inicioZ,

      altura,

      tipo

    );


    gerarFacesYTipo(

      dados,

      inicioX,
      inicioZ,

      altura,

      tipo

    );


    gerarFacesZTipo(

      dados,

      inicioX,
      inicioZ,

      altura,

      tipo

    );

  }


  return geometrias;

}


/*
==================================================
REMOVER CHUNK
==================================================
*/

function removerChunk(

  chunkX,
  chunkZ

) {

  const id =
    chaveChunk(
      chunkX,
      chunkZ
    );


  const meshes =
    chunksRenderizados.get(
      id
    );


  if (!meshes) {

    return;

  }


  for (
    const mesh
    of meshes
  ) {

    cena.remove(
      mesh
    );


    mesh.geometry.dispose();

  }


  chunksRenderizados.delete(
    id

  );

}


/*
==================================================
POSIÇÃO -> CHUNK
==================================================
*/

function obterChunk(

  x,
  z

) {

  const metade =
    TAMANHO_MUNDO /
    2;


  return {

    x:

      Math.floor(

        (
          x +
          metade
        ) /
        TAMANHO_CHUNK

      ),

    z:

      Math.floor(

        (
          z +
          metade
        ) /
        TAMANHO_CHUNK

      )

  };

}


/*
==================================================
DISTÂNCIA DO CHUNK
==================================================
*/

function distanciaChunk(

  cx,
  cz

) {

  const metade =
    TAMANHO_MUNDO /
    2;


  const x =

    cx *
    TAMANHO_CHUNK +

    TAMANHO_CHUNK /
    2 -

    metade;


  const z =

    cz *
    TAMANHO_CHUNK +

    TAMANHO_CHUNK /
    2 -

    metade;


  const dx =
    x -
    jogador.x;


  const dz =
    z -
    jogador.z;


  return Math.sqrt(

    dx * dx +
    dz * dz

  );

}


/*
==================================================
CHUNKS VISÍVEIS
==================================================
*/

let ultimoChunkX =
  null;


let ultimoChunkZ =
  null;


function atualizarChunks(

  forcar = false

) {

  const atual =
    obterChunk(

      jogador.x,
      jogador.z

    );


  if (

    !forcar &&

    atual.x ===
      ultimoChunkX &&

    atual.z ===
      ultimoChunkZ

  ) {

    return;

  }


  ultimoChunkX =
    atual.x;


  ultimoChunkZ =
    atual.z;


  /*
  Cria apenas chunks próximos.

  Não tenta gerar os 100x100 inteiros
  como geometria.

  */

  for (
    let cx = 0;
    cx < NUM_CHUNKS;
    cx++
  ) {

    for (
      let cz = 0;
      cz < NUM_CHUNKS;
      cz++
    ) {

      if (

        distanciaChunk(
          cx,
          cz
        ) >
        DISTANCIA_CHUNKS

      ) {

        continue;

      }


      const id =
        chaveChunk(
          cx,
          cz
        );


      if (

        !chunksRenderizados
          .has(id)

      ) {

        construirChunk(

          cx,
          cz

        );

      }

    }

  }


  /*
  Remove os distantes.
  */

  for (
    const id
    of [
      ...chunksRenderizados.keys()
    ]
  ) {

    const partes =
      id.split(
        ","
      );


    const cx =
      Number(
        partes[0]
      );


    const cz =
      Number(
        partes[1]
      );


    if (

      distanciaChunk(
        cx,
        cz
      ) >

      DISTANCIA_CHUNKS

    ) {

      removerChunk(

        cx,
        cz

      );

    }

  }

}


/*
==================================================
RECONSTRUIR CHUNKS AFETADOS
==================================================
*/

function reconstruirChunksAoRedor(

  x,
  z

) {

  const centro =
    obterChunk(

      x,
      z

    );


  for (
    let dx = -1;
    dx <= 1;
    dx++
  ) {

    for (
      let dz = -1;
      dz <= 1;
      dz++
    ) {

      const cx =
        centro.x +
        dx;


      const cz =
        centro.z +
        dz;


      if (

        cx < 0 ||
        cz < 0 ||

        cx >= NUM_CHUNKS ||
        cz >= NUM_CHUNKS

      ) {

        continue;

      }


      const id =
        chaveChunk(
          cx,
          cz
        );


      /*
      Só reconstruímos se
      o chunk estiver carregado.
      */

      if (
        chunksRenderizados.has(
          id
        )
      ) {

        construirChunk(

          cx,
          cz

        );

      }

    }

  }

}


/*
==================================================
JOGADOR
==================================================
*/

const jogador = {

  x:
    0,

  y:
    0.5,

  z:
    0,

  largura:
    0.6,

  profundidade:
    0.6,

  altura:
    ALTURA_NORMAL,

  velocidadeY:
    0,

  noChao:
    true,

  agachado:
    false

};


/*
==================================================
COLISÃO
==================================================
*/

function colideComBloco(

  x,
  y,
  z,
  bloco,

  altura =
    jogador.altura

) {

  return (

    x +
      jogador.largura / 2 >

      bloco.x - 0.5 &&

    x -
      jogador.largura / 2 <

      bloco.x + 0.5 &&

    y +
      altura >

      bloco.y - 0.5 &&

    y <
      bloco.y + 0.5 &&

    z +
      jogador.profundidade / 2 >

      bloco.z - 0.5 &&

    z -
      jogador.profundidade / 2 <

      bloco.z + 0.5

  );

}


/*
==================================================
PODE MOVER
==================================================
*/

function podeMoverPara(

  x,
  y,
  z

) {

  const minX =
    Math.floor(
      x - 2
    );


  const maxX =
    Math.ceil(
      x + 2
    );


  const minY =
    Math.floor(
      y - 1
    );


  const maxY =
    Math.ceil(

      y +
      jogador.altura +
      1

    );


  const minZ =
    Math.floor(
      z - 2
    );


  const maxZ =
    Math.ceil(
      z + 2
    );


  for (
    let bx = minX;
    bx <= maxX;
    bx++
  ) {

    for (
      let by = minY;
      by <= maxY;
      by++
    ) {

      for (
        let bz = minZ;
        bz <= maxZ;
        bz++
      ) {

        const bloco =
          pegarBloco(

            bx,
            by,
            bz

          );


        if (

          bloco &&

          colideComBloco(

            x,
            y,
            z,
            bloco

          )

        ) {

          return false;

        }

      }

    }

  }


  return true;

}


/*
==================================================
APOIO NO CHÃO
==================================================
*/

function temApoioNoChao(

  x,
  z

) {

  const y =
    jogador.y -
    0.08;


  const minX =
    Math.floor(

      x -
      jogador.largura / 2

    );


  const maxX =
    Math.floor(

      x +
      jogador.largura / 2

    );


  const minZ =
    Math.floor(

      z -
      jogador.profundidade / 2

    );


  const maxZ =
    Math.floor(

      z +
      jogador.profundidade / 2

    );


  for (
    let bx = minX;
    bx <= maxX;
    bx++
  ) {

    for (
      let bz = minZ;
      bz <= maxZ;
      bz++
    ) {

      const bloco =
        pegarBloco(

          bx,
          Math.floor(y),
          bz

        );


      if (
        !bloco
      ) {

        continue;

      }


      if (

        x +
          jogador.largura / 2 >
          bloco.x - 0.5 &&

        x -
          jogador.largura / 2 <
          bloco.x + 0.5 &&

        z +
          jogador.profundidade / 2 >
          bloco.z - 0.5 &&

        z -
          jogador.profundidade / 2 <
          bloco.z + 0.5

      ) {

        return true;

      }

    }

  }


  return false;

}


/*
==================================================
AGACHAMENTO
==================================================
*/

function podeMoverParaAltura(

  altura

) {

  const minX =
    Math.floor(
      jogador.x - 2
    );


  const maxX =
    Math.ceil(
      jogador.x + 2
    );


  const minY =
    Math.floor(
      jogador.y - 1
    );


  const maxY =
    Math.ceil(
      jogador.y +
      altura +
      1
    );


  const minZ =
    Math.floor(
      jogador.z - 2
    );


  const maxZ =
    Math.ceil(
      jogador.z + 2
    );


  for (
    let x = minX;
    x <= maxX;
    x++
  ) {

    for (
      let y = minY;
      y <= maxY;
      y++
    ) {

      for (
        let z = minZ;
        z <= maxZ;
        z++
      ) {

        const bloco =
          pegarBloco(
            x,
            y,
            z
          );


        if (

          bloco &&

          colideComBloco(

            jogador.x,
            jogador.y,
            jogador.z,

            bloco,

            altura

          )

        ) {

          return false;

        }

      }

    }

  }


  return true;

}


function atualizarAgachamento() {

  if (
    teclas["control"]
  ) {

    jogador.agachado =
      true;

    jogador.altura =
      ALTURA_AGACHADO;

  }

  else if (

    jogador.agachado &&

    podeMoverParaAltura(
      ALTURA_NORMAL
    )

  ) {

    jogador.agachado =
      false;

    jogador.altura =
      ALTURA_NORMAL;

  }

}


/*
==================================================
TECLAS
==================================================
*/

const teclas =
  {};


window.addEventListener(

  "keydown",

  evento => {

    const tecla =
      evento.key.toLowerCase();


    teclas[tecla] =
      true;


    if (
      tecla === "1"
    ) {

      selecionarBloco(
        "azul"
      );

    }


    if (
      tecla === "2"
    ) {

      selecionarBloco(
        "verde"
      );

    }


    if (
      tecla === "3"
    ) {

      selecionarBloco(
        "vermelho"
      );

    }


    if (
      tecla === "4"
    ) {

      selecionarBloco(
        "madeira"
      );

    }


    if (
      tecla === "5"
    ) {

      selecionarBloco(
        "terra"
      );

    }


    if (
      tecla === "6"
    ) {

      selecionarBloco(
        "areia"
      );

    }


    if (
      evento.code === "Space"
    ) {

      evento.preventDefault();


      if (

        jogador.noChao &&

        !jogador.agachado

      ) {

        jogador.velocidadeY =
          FORCA_PULO;


        jogador.noChao =
          false;

      }

    }


    if (
      tecla === "f"
    ) {

      document.exitPointerLock();

    }

  }

);


window.addEventListener(

  "keyup",

  evento => {

    teclas[
      evento.key.toLowerCase()
    ] = false;

  }

);


/*
==================================================
SELEÇÃO
==================================================
*/

function selecionarBloco(
  tipo
) {

  blocoAtual =
    tipo;


  document
    .querySelectorAll(
      ".slot"
    )
    .forEach(
      slot => {

        slot.classList.remove(
          "selecionado"
        );

      }
    );


  const numero =
    tiposNumero[tipo];


  const slot =
    document.getElementById(

      `slot${numero}`

    );


  if (
    slot
  ) {

    slot.classList.add(
      "selecionado"
    );

  }


  if (
    nomeBlocoElement
  ) {

    nomeBlocoElement.textContent =
      tipos[tipo].nome;

  }


  if (
    corSelecionadaElement
  ) {

    corSelecionadaElement
      .className =
      "";


    corSelecionadaElement
      .classList.add(

        "bloco",
        tipo

      );

  }

}


/*
==================================================
INVENTÁRIO
==================================================
*/

function atualizarInventario() {

  for (
    const tipo
    of Object.keys(
      inventario
    )
  ) {

    if (
      quantidadeElementos[tipo]
    ) {

      quantidadeElementos[
        tipo
      ].textContent =
        inventario[tipo];

    }

  }

}


/*
==================================================
POINTER LOCK
==================================================
*/

renderer.domElement.addEventListener(

  "click",

  () => {

    renderer.domElement
      .requestPointerLock();

  }

);


/*
==================================================
ROTAÇÃO
==================================================
*/

let rotacaoHorizontal =
  0;


let rotacaoVertical =
  0.35;


document.addEventListener(

  "mousemove",

  evento => {

    if (

      document.pointerLockElement ===
      renderer.domElement

    ) {

      rotacaoHorizontal -=

        evento.movementX *
        0.003;


      rotacaoVertical -=

        evento.movementY *
        0.003;


      const limite =

        Math.PI / 2 -
        0.1;


      rotacaoVertical =

        Math.max(

          -limite,

          Math.min(

            limite,

            rotacaoVertical

          )

        );

    }

  }

);


/*
==================================================
RAYCAST
==================================================
*/

const raycaster =
  new THREE.Raycaster();


raycaster.far =
  DISTANCIA_INTERACAO;


const centro =
  new THREE.Vector2(
    0,
    0
  );


function obterAlvo() {

  raycaster.setFromCamera(

    centro,
    camera

  );


  const objetos =
    raycaster.intersectObjects(

      [
        ...cena.children
      ],

      false

    );


  for (
    const intersecao
    of objetos
  ) {

    if (
      intersecao.object
        .userData
        .chunkX ===
        undefined
    ) {

      continue;

    }


    const normal =
      intersecao.face
        .normal
        .clone();


    normal.transformDirection(

      intersecao.object
        .matrixWorld

    );


    /*
    Move um pouco para dentro.
    */

    const ponto =
      intersecao.point
        .clone()
        .add(

          normal
            .clone()
            .multiplyScalar(
              -0.001
            )

        );


    const x =
      Math.floor(
        ponto.x + 0.5
      );


    const y =
      Math.floor(
        ponto.y + 0.5
      );


    const z =
      Math.floor(
        ponto.z + 0.5
      );


    const bloco =
      pegarBloco(

        x,
        y,
        z

      );


    if (
      bloco
    ) {

      return {

        bloco,

        normal,

        ponto,

        mesh:
          intersecao.object

      };

    }

  }


  return null;

}


/*
==================================================
QUEBRAR
==================================================
*/

let mouseEsquerdo =
  false;


let blocoQuebrandoId =
  null;


let tempoQuebrando =
  0;


window.addEventListener(

  "mousedown",

  evento => {

    if (
      evento.button === 0
    ) {

      mouseEsquerdo =
        true;


      renderer.domElement
        .requestPointerLock();

    }


    if (
      evento.button === 2
    ) {

      colocarBloco();

    }

  }

);


window.addEventListener(

  "mouseup",

  evento => {

    if (
      evento.button === 0
    ) {

      mouseEsquerdo =
        false;


      cancelarQuebra();

    }

  }

);


window.addEventListener(

  "contextmenu",

  evento => {

    evento.preventDefault();

  }

);


/*
==================================================
ATUALIZAR QUEBRA
==================================================
*/

function atualizarQuebra(
  delta
) {

  if (
    !mouseEsquerdo
  ) {

    cancelarQuebra();

    return;

  }


  const alvo =
    obterAlvo();


  if (
    !alvo
  ) {

    cancelarQuebra();

    return;

  }


  const bloco =
    alvo.bloco;


  const distancia =

    new THREE.Vector3(

      bloco.x,
      bloco.y,
      bloco.z

    ).distanceTo(

      camera.position

    );


  if (
    distancia >
    DISTANCIA_INTERACAO
  ) {

    cancelarQuebra();

    return;

  }


  const id =
    chave(

      bloco.x,
      bloco.y,
      bloco.z

    );


  if (
    blocoQuebrandoId !==
    id
  ) {

    blocoQuebrandoId =
      id;

    tempoQuebrando =
      0;

  }


  tempoQuebrando +=
    delta;


  if (
    quebrandoElement
  ) {

    quebrandoElement.style.display =
      "block";

  }


  const progresso =

    Math.min(

      tempoQuebrando /
      TEMPO_QUEBRAR,

      1

    );


  if (
    progressoQuebrando
  ) {

    progressoQuebrando.style.width =
      `${progresso * 100}%`;

  }


  if (
    tempoQuebrando >=
    TEMPO_QUEBRAR
  ) {

    destruirBloco(
      bloco
    );


    cancelarQuebra();

  }

}


/*
==================================================
CANCELAR
==================================================
*/

function cancelarQuebra() {

  blocoQuebrandoId =
    null;

  tempoQuebrando =
    0;


  if (
    quebrandoElement
  ) {

    quebrandoElement.style.display =
      "none";

  }


  if (
    progressoQuebrando
  ) {

    progressoQuebrando.style.width =
      "0%";

  }

}


/*
==================================================
DESTRUIR
==================================================
*/

function destruirBloco(
  bloco
) {

  const distancia =

    new THREE.Vector3(

      bloco.x,
      bloco.y,
      bloco.z

    ).distanceTo(

      camera.position

    );


  if (
    distancia >
    DISTANCIA_INTERACAO
  ) {

    return;

  }


  const id =
    chave(

      bloco.x,
      bloco.y,
      bloco.z

    );


  if (
    !blocos.has(id)
  ) {

    return;

  }


  removerBloco(

    bloco.x,
    bloco.y,
    bloco.z

  );


  inventario[
    bloco.tipo
  ]++;


  atualizarInventario();


  reconstruirChunksAoRedor(

    bloco.x,
    bloco.z

  );


  jogador.noChao =
    false;

}


/*
==================================================
COLOCAR
==================================================
*/

function colocarBloco() {

  if (
    document.pointerLockElement !==
    renderer.domElement
  ) {

    return;

  }


  if (
    inventario[
      blocoAtual
    ] <= 0
  ) {

    return;

  }


  const alvo =
    obterAlvo();


  if (
    !alvo
  ) {

    return;

  }


  const bloco =
    alvo.bloco;


  const novoX =
    Math.round(

      bloco.x +
      alvo.normal.x

    );


  const novoY =
    Math.round(

      bloco.y +
      alvo.normal.y

    );


  const novoZ =
    Math.round(

      bloco.z +
      alvo.normal.z

    );


  if (
    existeBloco(

      novoX,
      novoY,
      novoZ

    )
  ) {

    return;

  }


  const distancia =

    new THREE.Vector3(

      novoX,
      novoY,
      novoZ

    ).distanceTo(

      camera.position

    );


  if (
    distancia >
    DISTANCIA_INTERACAO
  ) {

    return;

  }


  if (
    colideComBloco(

      jogador.x,
      jogador.y,
      jogador.z,

      {

        x:
          novoX,

        y:
          novoY,

        z:
          novoZ

      }

    )
  ) {

    return;

  }


  salvarBloco(

    novoX,
    novoY,
    novoZ,

    blocoAtual

  );


  inventario[
    blocoAtual
  ]--;


  atualizarInventario();


  reconstruirChunksAoRedor(

    novoX,
    novoZ

  );

}


/*
==================================================
MOVIMENTO
==================================================
*/

function atualizarMovimento(
  delta
) {

  let frente =
    0;


  let direita =
    0;


  if (
    teclas["w"]
  ) {

    frente += 1;

  }


  if (
    teclas["s"]
  ) {

    frente -= 1;

  }


  if (
    teclas["a"]
  ) {

    direita -= 1;

  }


  if (
    teclas["d"]
  ) {

    direita += 1;

  }


  /*
  Normalização diagonal.
  */

  const tamanho =

    Math.sqrt(

      frente *
        frente +

      direita *
        direita

    );


  if (
    tamanho > 0
  ) {

    frente /=
      tamanho;


    direita /=
      tamanho;

  }


  /*
  Velocidade.
  */

  let velocidade =
    VELOCIDADE_ANDANDO;


  if (

    teclas["shift"] &&

    !jogador.agachado

  ) {

    velocidade =
      VELOCIDADE_CORRENDO;

  }


  if (
    jogador.agachado
  ) {

    velocidade =
      VELOCIDADE_AGACHADO;

  }


  /*
  Direção baseada diretamente
  na rotação horizontal.

  W = frente
  S = trás
  */

  const frenteX =
    -Math.sin(
      rotacaoHorizontal
    );


  const frenteZ =
    -Math.cos(
      rotacaoHorizontal
    );


  const direitaX =
    Math.cos(
      rotacaoHorizontal
    );


  const direitaZ =
    -Math.sin(
      rotacaoHorizontal
    );


  const movimentoX =

    (

      frenteX *
        frente +

      direitaX *
        direita

    ) *

    velocidade *

    delta;


  const movimentoZ =

    (

      frenteZ *
        frente +

      direitaZ *
        direita

    ) *

    velocidade *

    delta;


  /*
  X.
  */

  const novoX =
    jogador.x +
    movimentoX;


  if (

    podeMoverPara(

      novoX,

      jogador.y,

      jogador.z

    )

  ) {

    if (

      !jogador.agachado ||

      temApoioNoChao(

        novoX,
        jogador.z

      )

    ) {

      jogador.x =
        novoX;

    }

  }


  /*
  Z.
  */

  const novoZ =
    jogador.z +
    movimentoZ;


  if (

    podeMoverPara(

      jogador.x,

      jogador.y,

      novoZ

    )

  ) {

    if (

      !jogador.agachado ||

      temApoioNoChao(

        jogador.x,
        novoZ

      )

    ) {

      jogador.z =
        novoZ;

    }

  }


  /*
  Gravidade.
  */

  jogador.velocidadeY +=

    GRAVIDADE *
    delta;


  moverVertical(
    delta
  );


  /*
  Status.
  */

  if (
    statusMovimento
  ) {

    const movendo =

      teclas["w"] ||
      teclas["s"] ||
      teclas["a"] ||
      teclas["d"];


    if (
      jogador.agachado
    ) {

      statusMovimento.textContent =
        "AGACHADO";

    }

    else if (

      teclas["shift"] &&
      movendo

    ) {

      statusMovimento.textContent =
        "CORRENDO";

    }

    else {

      statusMovimento.textContent =
        "ANDANDO";

    }

  }

}


/*
==================================================
VERTICAL
==================================================
*/

function moverVertical(
  delta
) {

  const novoY =

    jogador.y +

    jogador.velocidadeY *
    delta;


  const minX =
    Math.floor(
      jogador.x - 2
    );


  const maxX =
    Math.ceil(
      jogador.x + 2
    );


  const minY =
    Math.floor(

      Math.min(

        jogador.y,
        novoY

      ) - 2

    );


  const maxY =
    Math.ceil(

      Math.max(

        jogador.y,
        novoY

      ) +

      jogador.altura +
      1

    );


  const minZ =
    Math.floor(
      jogador.z - 2
    );


  const maxZ =
    Math.ceil(
      jogador.z + 2
    );


  /*
  Queda.
  */

  if (
    jogador.velocidadeY <= 0
  ) {

    let maiorTopo =
      -Infinity;


    for (
      let bx = minX;
      bx <= maxX;
      bx++
    ) {

      for (
        let by = minY;
        by <= maxY;
        by++
      ) {

        for (
          let bz = minZ;
          bz <= maxZ;
          bz++
        ) {

          const bloco =
            pegarBloco(

              bx,
              by,
              bz

            );


          if (
            !bloco
          ) {

            continue;

          }


          const tocaX =

            jogador.x +
              jogador.largura / 2 >

            bloco.x - 0.5 &&

            jogador.x -
              jogador.largura / 2 <

            bloco.x + 0.5;


          const tocaZ =

            jogador.z +
              jogador.profundidade / 2 >

            bloco.z - 0.5 &&

            jogador.z -
              jogador.profundidade / 2 <

            bloco.z + 0.5;


          const topo =
            bloco.y +
            0.5;


          if (

            tocaX &&
            tocaZ &&

            novoY <= topo &&

            jogador.y >=
              topo - 0.5

          ) {

            maiorTopo =
              Math.max(

                maiorTopo,
                topo

              );

          }

        }

      }

    }


    if (
      maiorTopo !==
      -Infinity
    ) {

      jogador.y =
        maiorTopo;


      jogador.velocidadeY =
        0;


      jogador.noChao =
        true;


      return;

    }

  }


  /*
  Subindo.
  */

  if (
    jogador.velocidadeY > 0
  ) {

    for (
      let bx = minX;
      bx <= maxX;
      bx++
    ) {

      for (
        let by = minY;
        by <= maxY;
        by++
      ) {

        for (
          let bz = minZ;
          bz <= maxZ;
          bz++
        ) {

          const bloco =
            pegarBloco(

              bx,
              by,
              bz

            );


          if (
            !bloco
          ) {

            continue;

          }


          if (

            colideComBloco(

              jogador.x,
              novoY,
              jogador.z,

              bloco

            )

          ) {

            jogador.y =

              bloco.y -
              0.5 -
              jogador.altura;


            jogador.velocidadeY =
              0;


            return;

          }

        }

      }

    }

  }


  jogador.y =
    novoY;


  jogador.noChao =
    false;


  /*
  Recuperação.
  */

  if (
    jogador.y < -30
  ) {

    jogador.x =
      0;

    jogador.y =
      0.5;

    jogador.z =
      0;

    jogador.velocidadeY =
      0;

    jogador.noChao =
      true;

  }

}


/*
==================================================
FPS
==================================================
*/

let frames =
  0;


let ultimoFPS =
  performance.now();


function atualizarFPS() {

  if (
    !fpsElement
  ) {

    return;

  }


  frames++;


  const agora =
    performance.now();


  const intervalo =
    agora -
    ultimoFPS;


  if (
    intervalo >= 500
  ) {

    const fps =

      Math.round(

        frames *
        1000 /
        intervalo

      );


    fpsElement.textContent =
      `FPS: ${fps}`;


    frames =
      0;


    ultimoFPS =
      agora;

  }

}


/*
==================================================
LOOP
==================================================
*/

const relogio =
  new THREE.Clock();


function animar() {

  requestAnimationFrame(
    animar
  );


  /*
  Física baseada em segundos.
  */

  const delta =

    Math.min(

      relogio.getDelta(),

      0.05

    );


  atualizarAgachamento();


  atualizarMovimento(
    delta
  );


  atualizarQuebra(
    delta
  );


  atualizarChunks();


  /*
  Câmera.
  */

  camera.position.set(

    jogador.x,

    jogador.y +
      (
        jogador.agachado
          ? 0.82
          : 1.55
      ),

    jogador.z

  );


  camera.rotation.order =
    "YXZ";


  camera.rotation.y =
    rotacaoHorizontal;


  camera.rotation.x =
    rotacaoVertical;


  /*
  Render.
  */

  renderer.render(

    cena,
    camera

  );


  atualizarFPS();

}


/*
==================================================
INICIAR
==================================================
*/

function iniciarJogo() {

  gerarMundo();


  /*
  Inventário começa zerado.
  */

  for (
    const tipo
    of Object.keys(
      inventario
    )
  ) {

    inventario[tipo] =
      0;

  }


  atualizarInventario();


  jogador.x =
    0;

  jogador.y =
    0.5;

  jogador.z =
    0;

  jogador.velocidadeY =
    0;

  jogador.noChao =
    true;


  jogador.agachado =
    false;


  jogador.altura =
    ALTURA_NORMAL;


  selecionarBloco(
    "azul"
  );


  /*
  Só os chunks próximos
  são criados na GPU.
  */

  atualizarChunks(
    true
  );


  /*
  FPS inicial.
  */

  if (
    fpsElement
  ) {

    fpsElement.textContent =
      "FPS: 0";

  }


  animar();

}


iniciarJogo();


/*
==================================================
RESIZE
==================================================
*/

window.addEventListener(

  "resize",

  () => {

    camera.aspect =

      window.innerWidth /
      window.innerHeight;


    camera.updateProjectionMatrix();


    renderer.setSize(

      window.innerWidth,
      window.innerHeight

    );


    /*
    Continua sem limitador,
    mas evita resolução exagerada.
    */

    renderer.setPixelRatio(

      Math.min(

        window.devicePixelRatio,

        1.5

      )

    );

  }

);
```
