import TheoryContent from './TheoryContent';
import PracticeExercise from './PracticeExercise';
import BattleMode from './BattleMode';
import './Paraphrasing.css';

interface ParaphrasingModuleProps {
    activeTab: 'theory' | 'practice' | 'battle';
}

export default function ParaphrasingModule({ activeTab }: ParaphrasingModuleProps) {
    return (
        <div className="paraphrasing-module">
            {activeTab === 'theory' && <TheoryContent />}
            {activeTab === 'practice' && <PracticeExercise />}
            {activeTab === 'battle' && <BattleMode />}
        </div>
    );
}
