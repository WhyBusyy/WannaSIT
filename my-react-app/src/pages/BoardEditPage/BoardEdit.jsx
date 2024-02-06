import React, { useState} from "react";
import { useParams } from 'react-router-dom';
import { useNavigate } from "react-router-dom";
import { useLocation } from 'react-router-dom';
import "./BoardEdit.css";
import BackHeader from "../../components/Header/BackHeader";
import BoardEditModal from "../../components/Modal/BoardEditModal";
import api from "../../services/api";

function BoardEdit() {
    const { postID } = useParams();
    const location = useLocation();
    const initialEditData = location.state;
    const [editData, setEditData] = useState(initialEditData);
    const [ModalOpen, setModalOpen] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = (event) => {
        event.preventDefault();
        // 등록 전에 사용자 확인 모달 열기
        setModalOpen(true);
    };

    const handleConfirmEdit = () => {
        api.put(`/posts/${postID}`, editData)
            .then((response) => {
                if (response.data.message === "게시글 수정 성공") {
                    setModalOpen(false); // 수정 후 모달 닫기
                    navigate(`/boards/${postID}`);
                }
            })
            .catch((error) => {
                console.error('수정 오류:', error.message);
                alert('수정 중 오류가 발생했습니다.');
            });
    };

    return (
        <div className='BoardEdit'>
            <BackHeader />
            <div className="editButtonWrap">
                <button type="button" onClick={handleSubmit}>완료</button>
            </div>
            <div className="editCont">
                <form>
                    <input
                        type="text"
                        value={editData.title}
                        onChange={(event) => setEditData({...editData, title: event.target.value})}
                    />
                    <textarea
                        value={editData.content}
                        onChange={(event) => setEditData({...editData, content: event.target.value})}
                    ></textarea>
                </form>
            </div>
            <BoardEditModal isOpen={ModalOpen} onConfirm={handleConfirmEdit} />
        </div>
    );
};

export default BoardEdit;
