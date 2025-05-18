import { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Container, Row, Col, Button, Form, Card } from 'react-bootstrap';
import './App.css';

function App() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [outputLines, setOutputLines] = useState([]);
  const [inputMode, setInputMode] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const socketRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    socketRef.current = new WebSocket('https://mini-code-editor-backend.vercel.app');

    socketRef.current.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.output) {
        setOutputLines((prev) => [...prev, data.output]);
      } else if (data.error) {
        setOutputLines((prev) => [...prev, '[Error] ' + data.error]);
      } else if (data.done) {
        setInputMode(false);
      }
    };

    return () => socketRef.current.close();
  }, []);

  useEffect(() => {
    if (inputMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputMode]);

  const runCode = () => {
    setOutputLines([]); // clear previous output
    setInputMode(true);
    socketRef.current.send(JSON.stringify({ language, code }));
  };
  
  const sendInput = () => {
    if (inputValue.trim()) {
      setOutputLines((prev) => [...prev, `> ${inputValue}`]); // show input as terminal
      socketRef.current.send(JSON.stringify({ input: inputValue }));
      setInputValue('');
    }
  };

  return (
    <Container className="py-4">
      <Card className="p-4 shadow">
        <h2 className="text-center mb-4">⚡Code Editor</h2>

        <Row className="mb-3">
          <Col md={6}>
            <Form.Select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="python">Python</option>
              {/* <option value="javascript">JavaScript</option> */}
            </Form.Select>
          </Col>
          <Col md={6} className="text-md-end mt-3 mt-md-0">
            <Button variant="primary" onClick={runCode}>
              ▶ Run Code
            </Button>
          </Col>
        </Row>

        <Editor
          height="300px"
          defaultLanguage={language}
          value={code}
          theme="vs-dark"
          onChange={(value) => setCode(value || '')}
        />

        <div className="mt-4">
          <h5>📤 Output:</h5>
          <div className="output-box">
            {outputLines.length === 0 ? (
              <pre>Output will appear here...</pre>
            ) : (
              outputLines.map((line, index) => (
                <pre key={index}>{line}</pre>
              ))
            )}

            {inputMode && (
              <Form.Control
                type="text"
                value={inputValue}
                ref={inputRef}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') sendInput();
                }}
                className="mt-2 bg-dark text-light"
              />
            )}
          </div>
        </div>
      </Card>
    </Container>
  );
};

export default App;