import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./BoardWrite.css";
import BackHeader from "../../components/Header/BackHeader";
import BoardWriteModal from "../../components/Modal/BoardWriteModal";
import api from "../../services/api";

function BoardWrite() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [ModalOpen, setModalOpen] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    const formTitle = document.getElementsByName("title")[0].value;
    const formContent = document.getElementsByName("content")[0].value;
    if (formTitle.trim() === "" || formContent.trim() === "") {
      return;
    } else {
      event.preventDefault();
      // 등록 전에 사용자 확인 모달 열기
      setModalOpen(true);
    }
  };

  const handleConfirmRegistration = async () => {
    try {
      const formData = { title, content };
      const response = await api.post('/posts', formData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.data.message === "게시글 등록 성공") {

        setTitle('');
        setContent('');
        setModalOpen(false); // 등록 후 모달 닫기
        navigate('/boards');
      }
    } catch (error) {
      console.error('글쓰기 오류:', error.message);
    }
  };

  const handleCancelRegistration = () => {
    // 사용자가 등록 취소를 선택한 경우 모달 닫기
    setModalOpen(false);
  };


  return (
    <div className='BoardWrite'>
      <BackHeader />
      <div className="registerButtonWrap">
        <button type="button" onClick={handleSubmit}>등록</button>
      </div>
      <div className="registerCont">
        <form>
          <input
            name="title"
            placeholder='제목을 입력해주세요'
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <textarea
            name="content"
            placeholder='내용을 입력해주세요'
            value={content}
            onChange={(event) => setContent(event.target.value)}
          ></textarea>
        </form>
      </div>
      <BoardWriteModal isOpen={ModalOpen} onConfirm={handleConfirmRegistration} onCancel={handleCancelRegistration} />
    </div>
  );
};

export default BoardWrite;