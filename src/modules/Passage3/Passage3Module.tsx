import TheoryContent from './TheoryContent';
import PracticeExercise from './PracticeExercise';
import BattleMode from './BattleMode';
import './Passage3.css';

interface Passage3ModuleProps {
    activeTab: 'theory' | 'practice' | 'battle';
}

export default function Passage3Module({ activeTab }: Passage3ModuleProps) {
    return (
        <div className="passage3-module">
            {activeTab === 'theory' && <TheoryContent />}
            {activeTab === 'practice' && <PracticeExercise />}
            {activeTab === 'battle' && <BattleMode />}
        </div>
    );
}
