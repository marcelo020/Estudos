# ⚔️ VandGuard

## 🎮 Sobre o Projeto

O **VandGuard** é um jogo de ação e sobrevivência 2D com visão top-down, onde o jogador precisa resistir a hordas crescentes de inimigos utilizando movimentação estratégica e ataques mágicos. O diferencial deste projeto é que ele foi desenvolvido inteiramente com Vanilla JavaScript e **HTML5 Canvas**, sem a utilização de engines de jogos prontas (como Unity ou Godot). 

O foco técnico do projeto foi criar um loop de renderização eficiente, gerenciar físicas de colisão customizadas e construir um sistema de animação baseado em *sprite sheets*.

## ✨ Principais Funcionalidades

*   **Renderização Customizada (Canvas API):** Ciclo de atualização de quadros otimizado (`requestAnimationFrame`) para garantir gameplay fluido.
*   **Sistema de Sprites e Animações:** Manipulação de sprite sheets para diferentes estados do personagem principal (idle, correndo, atacando).
*   **Mecânicas de Combate e Magia:** Sistema de partículas e hitboxes customizados para efeitos de magias e impacto.
*   **Inteligência Artificial de Inimigos:** 
    *   **Goblins:** Movimentação ágil e perseguição em grupo.
    *   **Zumbis:** Padrões de ataque mais lentos e resistentes.
    *   **Bosses:** Lutas de chefes com múltiplas fases e lógicas de área de efeito.

## 🛠️ Tecnologias Utilizadas

*   **JavaScript (ES6+):** Lógica de estado, classes de entidades (Player, Inimigos, Projéteis) e game loop.
*   **HTML5 Canvas:** Renderização 2D de todo o cenário e personagens.
*   **CSS3:** Estilização da interface de usuário (UI), menus e HUD (Health Bar, Score).

## ⌨️ Controles

| Tecla | Ação |
| :--- | :--- |
| `W`, `A`, `S`, `D` | Movimentação em 8 direções |
| `Mouse` | Mirar |
| `Botão Esquerdo` | Ataque Básico / Magia Principal |
| `Espaço` | Dash / Esquiva |

## 🚀 Como Rodar Localmente

Como o projeto é construído em tecnologias web nativas, não há necessidade de builds complexos. 

1. Clone o repositório:
```bash
git clone [https://github.com/marcelo020/](https://github.com/marcelo020/).git
