import FloatingBall from "./components/FloatingBall";

function App() {
  return (
    <div 
      className="fixed inset-0 w-screen h-screen overflow-hidden"
      style={{ background: "transparent" }}
    >
      <FloatingBall />
    </div>
  );
}

export default App;
