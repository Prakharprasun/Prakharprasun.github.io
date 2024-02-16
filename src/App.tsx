import Message from "./Message";
import ListGroup from "./components/ListGroup";
import NavBar from "./components/NavBar";
import Card from "./components/Card";
import Featured from "./components/Featured";
function App() {
  return (
    <div>
      <NavBar></NavBar>
      <h1>Experience</h1>
      <Featured></Featured>
      <ListGroup></ListGroup>
      <Message></Message>
      <Card></Card>
    </div>
  );
}
export default App;
