import VideoCall from '../components/VideoCall';

const Chat = ({ contactId }) => {
    return (
        <div>
            {/* Existing chat UI */}
            <VideoCall contactId={contactId} />
        </div>
    );
};

export default Chat;
