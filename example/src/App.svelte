<script>
	import { Circle, Circle2, Circle3, DoubleBounce, GoogleSpin, ScaleOut, SpinLine, Stretch, BarLoader, Jumper, RingLoader, SyncLoader, Rainbow, Wave, Firework, Pulse } from "../../src/index";
	export let name;
  
  </script>
  
  <style>
	.header {
	  margin-top: 50px;
	  display: flex;
      flex-direction: column;
	}
	h1 {
	  color: #ff3e00;
	  font-size: 48px;
	  font-weight: 400;
	  margin-top: 0;
	  margin-bottom: 10px;
	  text-align: center;
	}
	section {
	  display: grid;
	  grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
	  align-items: center;
	  justify-items: center;
	}
	.spinner-item {
	  min-width: 250px;
	  min-height: 250px;
	  display: flex;
	  justify-content: center;
	  align-items: center;
	  position: relative;
	}
	.spinner-title {
	  position: absolute;
	  bottom: 20px;
	}
	.btn {
	  margin-top: 20px;
	  padding: 10px 30px;
	  border-radius: 30px;
	  display: block;
	  margin: 0 auto;
	  color: #fff;
	  background-color: rgba(255, 62, 0, 1);
	  transition: all 0.15s ease;
	  box-sizing: border-box;
	  text-transform: uppercase;
	  text-decoration: none;
	}
	.btn:hover {
	  background-color: rgba(255, 62, 0, 0.8);
	}
  </style>
  <div class="header">
	<h1>{name.default}</h1>
	<a href="https://github.com/Schum123/svelte-loading-spinners" class="btn"
	  >Github</a
	>
  </div>
  <section>
  
	<div class="spinner-item">
		  <SpinLine size="60" color="#FF3E00"/>
		  <div class="spinner-title">SpinLine</div>
	  </div>
   
	  <div class="spinner-item">
			  <Circle2 size="60px"/>
			  <div class="spinner-title">Circle2</div>
	  </div>
	  <div class="spinner-item">
			  <DoubleBounce size="60" color="#FF3E00"/>
			  <div class="spinner-title">DoubleBounce</div>
	  </div>
	  <div class="spinner-item">
			  <Circle size="60" color="#FF3E00"/>
			  <div class="spinner-title">Circle</div>
	  </div>
	  <div class="spinner-item">
			  <Stretch size="60" color="#FF3E00"/>
			  <div class="spinner-title">Stretch</div>
	  </div>
	  <div class="spinner-item">
			  <Circle3 size="60px"/>
			  <div class="spinner-title">Circle3</div>
	  </div>
	  <div class="spinner-item">
			  <BarLoader size="100" color="#FF3E00"/>
			  <div class="spinner-title">BarLoader</div>
	  </div>
	  <div class="spinner-item">
			  <SyncLoader size="60" color="#FF3E00"/>
			  <div class="spinner-title">SyncLoader</div>
	  </div>
	  <div class="spinner-item">
			  <Jumper size="60" color="#FF3E00"/>
			  <div class="spinner-title">Jumper</div>
	  </div>
	  <div class="spinner-item">
			  <GoogleSpin size="60px"/>
			  <div class="spinner-title">GoogleSpin</div>
	  </div>
	  <div class="spinner-item">
			  <ScaleOut size="60" color="#FF3E00"/>
			  <div class="spinner-title">ScaleOut</div>
	  </div>
	  <div class="spinner-item">
			  <RingLoader size="60" color="#FF3E00"/>
		  <div class="spinner-title">RingLoader</div>
		</div>
		<div class="spinner-item">
			  <Rainbow size="60" color="#FF3E00"/>
		  <div class="spinner-title">Rainbow</div>
		</div>
		<div class="spinner-item">
			  <Wave size="60" color="#FF3E00"/>
		  <div class="spinner-title">Wave</div>
		</div>
		<div class="spinner-item">
			  <Firework size="60" color="#FF3E00"/>
		  <div class="spinner-title">Firework</div>
		</div>
		<div class="spinner-item">
			  <Pulse size="60" color="#FF3E00"/>
		  <div class="spinner-title">Pulse</div>
	  </div>
  </section>
  