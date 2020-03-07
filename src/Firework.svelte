<script>
import { css, keyframes } from "emotion";
export let size;
export let color;

const fire = keyframes`
    0% {opacity: 1;transform: scale(0.1);}
    25% {opacity: 0.85;}
    100% {transform: scale(1);opacity: 0;}
`;
const wrapper = css`
    width: ${size * 1.3}px;
    height: ${size * 1.3}px;
    display: flex;
    justify-content: center;
    align-items: center;
`;
const firework  = css`
    border: ${size / 10}px dotted ${color};
    width: ${size}px;
    height: ${size}px;
    border-radius: 50%;
    animation: ${fire} 1.25s cubic-bezier(0.165, 0.84, 0.44, 1) infinite;
`;
</script>
<div class="{wrapper}">
    <div class="{firework}" />
</div>
      