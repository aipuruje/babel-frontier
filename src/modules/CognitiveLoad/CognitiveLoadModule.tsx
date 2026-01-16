import TheoryContent from './TheoryContent';
import PracticeExercise from './PracticeExercise';
import BattleMode from './BattleMode';
import './CognitiveLoad.css';

interface CognitiveLoadModuleProps {
    activeTab: 'theory' | 'practice' | 'battle';
}

export default function CognitiveLoadModule({ activeTab }: CognitiveLoadModuleProps) {
    return (
        <div className="cognitive-load-module">
            {activeTab === 'theory' && <TheoryContent />}
            {activeTab === 'practice' && <PracticeExercise />}
            {activeTab === 'battle' && <BattleMode />}
        </div>
    );
}
