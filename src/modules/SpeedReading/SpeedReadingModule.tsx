import TheoryContent from './TheoryContent';
import PracticeExercise from './PracticeExercise';
import BattleMode from './BattleMode';
import './SpeedReading.css';

interface SpeedReadingModuleProps {
    activeTab: 'theory' | 'practice' | 'battle';
}

export default function SpeedReadingModule({ activeTab }: SpeedReadingModuleProps) {
    return (
        <div className="speed-reading-module">
            {activeTab === 'theory' && <TheoryContent />}
            {activeTab === 'practice' && <PracticeExercise />}
            {activeTab === 'battle' && <BattleMode />}
        </div>
    );
}
